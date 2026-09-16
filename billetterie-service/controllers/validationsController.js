const { TitreTransport, Validation } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const { verifierQrToken } = require('../utils/qrToken');
const { consommerVoyage } = require('../services/abonnementsClient');
const { enregistrerAudit } = require('../utils/auditLogger');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Enregistre le résultat (autorisé ou refusé) d'une tentative de validation. N'échoue
// jamais l'appelant : l'écriture de l'historique ne doit pas empêcher de répondre à l'agent.
const enregistrerValidation = async ({ titreId, clientId, abonnementId, agentId, resultat, motifRefus }) => {
  try {
    return await Validation.create({
      titre_id: titreId || null,
      client_id: clientId || null,
      abonnement_id: abonnementId || null,
      agent_id: agentId || null,
      resultat,
      motif_refus: motifRefus || null,
    });
  } catch (error) {
    logger.error('Échec de l\'enregistrement de la validation dans l\'historique :', error);
    return null;
  }
};

const refuser = async (res, { titreId, clientId, abonnementId, agentId, raison, statusCode = 403 }) => {
  await enregistrerValidation({ titreId, clientId, abonnementId, agentId, resultat: 'refuse', motifRefus: raison });
  logger.warn(`Validation REFUSEE. Titre : ${titreId || 'inconnu'}. Raison : ${raison}`);
  return res.status(statusCode).json({ statut_validation: 'REFUSE', raison });
};

// POST /api/validations/scanner - Scanner (qrData) ou saisir manuellement (titre_id) un
// titre de transport pour autoriser ou refuser un voyage. Orchestration complète décrite
// dans le cahier des charges : résoudre le titre, vérifier son statut, interroger le
// Service Abonnements pour la validité + consommation du voyage, puis journaliser.
exports.scannerEtValider = async (req, res) => {
  const { qrData, titre_id } = req.body;
  const agentId = req.user.id;

  try {
    let titreId = titre_id;

    if (qrData) {
      const payload = verifierQrToken(qrData);
      if (!payload) {
        return refuser(res, { agentId, raison: 'QR Code invalide ou falsifié.', statusCode: 400 });
      }
      titreId = payload.titre_id;
    }

    if (!titreId) {
      return res.status(400).json({ message: 'qrData ou titre_id est requis.' });
    }
    if (!UUID_REGEX.test(titreId)) {
      return refuser(res, { titreId: null, agentId, raison: 'QR Code inconnu : identifiant de titre invalide.', statusCode: 400 });
    }

    const titre = await TitreTransport.findByPk(titreId);
    if (!titre) {
      return refuser(res, { titreId, agentId, raison: 'QR Code inconnu : aucun titre de transport associé.', statusCode: 404 });
    }

    if (titre.statut !== 'actif') {
      return refuser(res, {
        titreId: titre.id, clientId: titre.client_id, abonnementId: titre.abonnement_id, agentId,
        raison: 'Ce titre de transport a été désactivé.',
      });
    }

    if (titre.date_expiration && new Date(titre.date_expiration) < new Date()) {
      return refuser(res, {
        titreId: titre.id, clientId: titre.client_id, abonnementId: titre.abonnement_id, agentId,
        raison: 'Ce titre de transport est expiré.',
      });
    }

    // La vérification de validité de l'abonnement (statut, dates, solde de voyages) ET la
    // consommation atomique du voyage sont entièrement déléguées au Service Abonnements :
    // c'est lui, et lui seul, qui possède et verrouille cette donnée (cf. gestion de la
    // concurrence). Le Service Billetterie ne fait ici que relayer sa décision.
    let decision;
    try {
      decision = await consommerVoyage(titre.abonnement_id, req.token);
    } catch (error) {
      return refuser(res, {
        titreId: titre.id, clientId: titre.client_id, abonnementId: titre.abonnement_id, agentId,
        raison: 'Le Service Abonnements est momentanément indisponible. Réessayez.',
        statusCode: 503,
      });
    }

    if (!decision.autorise) {
      return refuser(res, {
        titreId: titre.id, clientId: titre.client_id, abonnementId: titre.abonnement_id, agentId,
        raison: decision.raison,
      });
    }

    // Un ticket simple est à usage unique : une fois le voyage consommé (le Service
    // Abonnements vient de mettre son solde à zéro), le titre est désactivé de notre côté
    // pour qu'un nouveau scan du même QR Code soit immédiatement rejeté au niveau du titre
    // lui-même, sans même avoir à réinterroger le Service Abonnements.
    if (titre.type_titre === 'Ticket simple') {
      await titre.update({ statut: 'desactive' });
    }

    const validation = await enregistrerValidation({
      titreId: titre.id,
      clientId: titre.client_id,
      abonnementId: titre.abonnement_id,
      agentId,
      resultat: 'autorise',
    });

    logger.info(`Validation REUSSIE pour le titre ${titre.id} (agent ${agentId}).`);

    res.status(200).json({
      statut_validation: 'VALIDE',
      message: 'Validation réussie. Bon voyage !',
      details: {
        validation_id: validation?.id,
        date_validation: validation?.date_validation,
        titre_id: titre.id,
        type_titre: titre.type_titre,
        abonnement: decision.abonnement,
      },
    });
  } catch (error) {
    logger.error('Erreur interne lors du scan/validation :', error);
    res.status(500).json({ statut_validation: 'ERREUR', message: 'Une erreur interne est survenue lors de la validation.' });
  }
};

// POST /api/validations/manuelle - Alias explicite de la saisie manuelle par identifiant
// (secours quand le scan caméra échoue), avec entrée d'audit dédiée puisqu'il s'agit d'une
// action moins automatique qu'un scan.
exports.validerManuellement = async (req, res) => {
  await enregistrerAudit({
    utilisateurId: req.user.id,
    role: req.user.role,
    typeAction: 'VALIDATION_MANUELLE',
    ressourceId: req.body.titre_id,
    resultat: 'TENTATIVE',
    req,
  });
  return exports.scannerEtValider(req, res);
};

// GET /api/validations - Historique des validations (autorisées et refusées), filtrable
exports.listerValidations = async (req, res) => {
  try {
    const {
      titre_id, client_id, abonnement_id, agent_id, resultat,
      date_min, date_max, page = 1, limit = 20,
    } = req.query;

    const whereClause = {};
    if (titre_id) whereClause.titre_id = titre_id;
    if (client_id) whereClause.client_id = client_id;
    if (abonnement_id) whereClause.abonnement_id = abonnement_id;
    if (agent_id) whereClause.agent_id = agent_id;
    if (resultat) whereClause.resultat = resultat;
    if (date_min || date_max) {
      whereClause.date_validation = {};
      if (date_min) whereClause.date_validation[Op.gte] = new Date(date_min);
      if (date_max) whereClause.date_validation[Op.lte] = new Date(date_max);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const { count, rows: validations } = await Validation.findAndCountAll({
      where: whereClause,
      include: { model: TitreTransport, as: 'titre' },
      limit: parsedLimit,
      offset,
      order: [['date_validation', 'DESC']],
    });

    res.status(200).json({
      total: count,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.max(1, Math.ceil(count / parsedLimit)),
      validations,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'historique des validations :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des validations.' });
  }
};

// GET /api/validations/client/:client_id - Historique des passages d'un client donné
exports.listerValidationsParClient = async (req, res) => {
  try {
    const validations = await Validation.findAll({
      where: { client_id: req.params.client_id },
      order: [['date_validation', 'DESC']],
    });
    res.status(200).json(validations);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des validations du client ${req.params.client_id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération des validations du client.' });
  }
};
