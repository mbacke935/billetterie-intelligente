const { TitreTransport } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const { genererQrToken } = require('../utils/qrToken');
const { enregistrerAudit } = require('../utils/auditLogger');
const { obtenirUtilisateur } = require('../services/usersClient');

const USER_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/titres - Générer un titre de transport (et son QR Code) pour un abonnement/ticket
// déjà attribué côté Service Abonnements. Action sensible réservée aux administrateurs.
exports.genererTitre = async (req, res) => {
  try {
    const { client_id, abonnement_id, type_titre, date_expiration } = req.body;

    if (!client_id || !abonnement_id || !type_titre) {
      return res.status(400).json({ message: 'client_id, abonnement_id et type_titre sont requis.' });
    }
    if (!USER_ID_REGEX.test(client_id)) {
      return res.status(400).json({ message: 'Format de client_id invalide : identifiant du Service Utilisateurs attendu (24 caractères hexadécimaux).' });
    }
    if (!UUID_REGEX.test(abonnement_id)) {
      return res.status(400).json({ message: 'Format d\'abonnement_id invalide : UUID attendu.' });
    }
    if (!['Ticket simple', 'Limité', 'Illimité'].includes(type_titre)) {
      return res.status(400).json({ message: 'type_titre invalide.' });
    }

    // Vérifier l'existence et le statut du client auprès du Service Utilisateurs, seul
    // propriétaire de cette information (aucun accès direct à sa base MongoDB).
    let client;
    try {
      client = await obtenirUtilisateur(client_id, req.token);
    } catch (error) {
      return res.status(503).json({ message: 'Le Service Utilisateurs est momentanément indisponible.' });
    }
    if (!client) {
      return res.status(404).json({ message: 'Client introuvable auprès du Service Utilisateurs.' });
    }
    if (client.statut !== 'actif') {
      return res.status(400).json({ message: 'Impossible de générer un titre pour un client dont le compte n\'est pas actif.' });
    }

    const titre = await TitreTransport.create({
      client_id,
      abonnement_id,
      type_titre,
      date_expiration: date_expiration || null,
      statut: 'actif',
    });

    await enregistrerAudit({
      utilisateurId: req.user.id,
      role: req.user.role,
      typeAction: 'GENERATION_TITRE',
      ressourceId: titre.id,
      resultat: 'SUCCES',
      req,
    });

    logger.info(`Titre de transport généré : ${titre.id} pour le client ${client_id} (abonnement ${abonnement_id}).`);
    res.status(201).json(titre);
  } catch (error) {
    logger.error('Erreur lors de la génération du titre de transport :', error);
    res.status(500).json({ message: 'Erreur lors de la génération du titre de transport.' });
  }
};

// GET /api/titres - Consulter/filtrer les titres générés
exports.listerTitres = async (req, res) => {
  try {
    const { client_id, abonnement_id, statut, type_titre, search, page = 1, limit = 20 } = req.query;

    const whereClause = {};
    if (client_id) whereClause.client_id = client_id;
    if (abonnement_id) whereClause.abonnement_id = abonnement_id;
    if (statut) whereClause.statut = statut;
    if (type_titre) whereClause.type_titre = type_titre;
    // Recherche libre par identifiant (client) si fourni ; les recherches sur id/abonnement_id
    // (colonnes UUID) exigent une correspondance exacte, un LIKE y échouerait en base.
    if (search) {
      const clauses = [{ client_id: { [Op.iLike]: `%${search}%` } }];
      if (UUID_REGEX.test(search)) {
        clauses.push({ id: search }, { abonnement_id: search });
      }
      whereClause[Op.or] = clauses;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const { count, rows: titres } = await TitreTransport.findAndCountAll({
      where: whereClause,
      limit: parsedLimit,
      offset,
      order: [['date_creation', 'DESC']],
    });

    res.status(200).json({
      total: count,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.max(1, Math.ceil(count / parsedLimit)),
      titres,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des titres de transport :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des titres de transport.' });
  }
};

// GET /api/titres/:id - Consulter un titre par son identifiant
exports.obtenirTitre = async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant de titre invalide.' });
    }
    const titre = await TitreTransport.findByPk(req.params.id);
    if (!titre) {
      return res.status(404).json({ message: 'Titre de transport non trouvé.' });
    }
    res.status(200).json(titre);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du titre ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération du titre de transport.' });
  }
};

// GET /api/titres/by-abonnement/:abonnement_id - Retrouver le titre le plus récent associé
// à un abonnement donné (utile au frontend, qui manipule surtout des abonnement_id).
exports.obtenirTitreParAbonnement = async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.abonnement_id)) {
      return res.status(400).json({ message: 'Identifiant d\'abonnement invalide.' });
    }
    const titre = await TitreTransport.findOne({
      where: { abonnement_id: req.params.abonnement_id },
      order: [['date_creation', 'DESC']],
    });
    if (!titre) {
      return res.status(404).json({ message: 'Aucun titre de transport trouvé pour cet abonnement.' });
    }
    res.status(200).json(titre);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du titre pour l'abonnement ${req.params.abonnement_id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération du titre de transport.' });
  }
};

// GET /api/titres/:id/qrcode - Générer le contenu (signé) du QR Code d'un titre
exports.genererQrCode = async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant de titre invalide.' });
    }
    const titre = await TitreTransport.findByPk(req.params.id);
    if (!titre) {
      return res.status(404).json({ message: 'Titre de transport non trouvé.' });
    }

    const qrData = genererQrToken(titre.id);
    res.status(200).json({ qrData, titre });
  } catch (error) {
    logger.error(`Erreur lors de la génération du QR Code pour le titre ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la génération du QR Code.' });
  }
};

// PUT /api/titres/:id/desactiver - Désactiver un titre (action sensible, admin uniquement)
exports.desactiverTitre = async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant de titre invalide.' });
    }
    const titre = await TitreTransport.findByPk(req.params.id);
    if (!titre) {
      return res.status(404).json({ message: 'Titre de transport non trouvé.' });
    }

    await titre.update({ statut: 'desactive' });

    await enregistrerAudit({
      utilisateurId: req.user.id,
      role: req.user.role,
      typeAction: 'DESACTIVATION_TITRE',
      ressourceId: titre.id,
      resultat: 'SUCCES',
      req,
    });

    logger.info(`Titre ${titre.id} désactivé par l'utilisateur ${req.user.id}.`);
    res.status(200).json({ message: 'Titre désactivé.', titre });
  } catch (error) {
    logger.error(`Erreur lors de la désactivation du titre ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la désactivation du titre.' });
  }
};

// PUT /api/titres/:id/activer - Réactiver un titre (action sensible, admin uniquement)
exports.activerTitre = async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant de titre invalide.' });
    }
    const titre = await TitreTransport.findByPk(req.params.id);
    if (!titre) {
      return res.status(404).json({ message: 'Titre de transport non trouvé.' });
    }

    await titre.update({ statut: 'actif' });

    await enregistrerAudit({
      utilisateurId: req.user.id,
      role: req.user.role,
      typeAction: 'REACTIVATION_TITRE',
      ressourceId: titre.id,
      resultat: 'SUCCES',
      req,
    });

    logger.info(`Titre ${titre.id} réactivé par l'utilisateur ${req.user.id}.`);
    res.status(200).json({ message: 'Titre réactivé.', titre });
  } catch (error) {
    logger.error(`Erreur lors de la réactivation du titre ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la réactivation du titre.' });
  }
};
