const { Abonnement, TypeAbonnement, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// Format attendu pour user_id : l'ObjectId Mongo généré par le Service Utilisateurs (24 caractères hexadécimaux)
const USER_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// Attribuer un abonnement à un utilisateur
exports.attribuerAbonnement = async (req, res) => {
  try {
    // Un client ne peut s'abonner que pour lui-même : on ignore tout user_id fourni dans
    // le corps de la requête et on force celui du token, pour empêcher un client d'acheter
    // un abonnement au nom d'un autre utilisateur.
    const user_id = req.user.role === 'client' ? req.user.id : req.body.user_id;
    const { type_abonnement_id, voyages_personnalises } = req.body;

    if (!user_id || !type_abonnement_id) {
      return res.status(400).json({ message: 'user_id et type_abonnement_id sont requis.' });
    }
    if (!USER_ID_REGEX.test(user_id)) {
      return res.status(400).json({ message: 'Format de user_id invalide : identifiant du Service Utilisateurs attendu (24 caractères hexadécimaux).' });
    }

    const type = await TypeAbonnement.findByPk(type_abonnement_id);
    if (!type) {
      return res.status(404).json({ message: 'Type d\'abonnement non trouvé.' });
    }
    if (!type.actif) {
      return res.status(400).json({ message: 'Cette formule d\'abonnement a été archivée et ne peut plus être attribuée.' });
    }

    // La personnalisation du nombre de voyages est une action de gestion réservée à
    // l'administrateur : un client qui s'abonne lui-même reçoit toujours la valeur par
    // défaut de la formule choisie.
    if (voyages_personnalises !== undefined && req.user.role === 'client') {
      return res.status(403).json({ message: 'Seul un administrateur peut personnaliser le nombre de voyages accordés.' });
    }

    // Pour une formule "Limité", l'administrateur peut personnaliser le nombre de
    // voyages accordés pour cet abonnement précis, au lieu de reprendre la valeur
    // par défaut de la formule (type.voyages_initiaux).
    if (voyages_personnalises !== undefined && type.nom !== 'Limité') {
      return res.status(400).json({ message: 'Un nombre de voyages personnalisé ne peut être défini que pour une formule "Limité".' });
    }
    if (voyages_personnalises !== undefined && (!Number.isInteger(voyages_personnalises) || voyages_personnalises < 1)) {
      return res.status(400).json({ message: 'Le nombre de voyages personnalisé doit être un entier positif.' });
    }

    const dateDebut = new Date();
    const dateExpiration = new Date();
    dateExpiration.setDate(dateDebut.getDate() + type.duree_validite);

    // Si illimité, voyages_restants est défini à -1
    const voyagesRestants = type.nom === 'Illimité'
      ? -1
      : (voyages_personnalises ?? type.voyages_initiaux ?? 0);

    const nouvelAbonnement = await Abonnement.create({
      user_id,
      type_abonnement_id,
      date_debut: dateDebut,
      date_expiration: dateExpiration,
      voyages_restants: voyagesRestants,
      voyages_consommes: 0,
      statut: 'Actif'
    });

    logger.info(`Nouvel abonnement attribué : ${nouvelAbonnement.id} pour l'utilisateur ${user_id}. Formule : ${type.nom}`);
    res.status(201).json(nouvelAbonnement);
  } catch (error) {
    logger.error('Erreur lors de l\'attribution de l\'abonnement :', error);
    res.status(500).json({ message: 'Erreur lors de l\'attribution de l\'abonnement.', error: error.message });
  }
};

// Corriger un abonnement (limité ou illimité) : date de début, date d'expiration
// ou voyages restants. Ne modifie ni le statut (voir suspendre/renouveler/resilier)
// ni la formule (type_abonnement_id), pour éviter d'incohérences avec les compteurs déjà posés.
exports.modifierAbonnement = async (req, res) => {
  try {
    const { id } = req.params;
    const { date_debut, date_expiration, voyages_restants } = req.body;

    const abonnement = await Abonnement.findByPk(id, {
      include: { model: TypeAbonnement, as: 'typeAbonnement' }
    });

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé.' });
    }

    const champsAMettreAJour = {};

    if (date_debut !== undefined) {
      champsAMettreAJour.date_debut = date_debut;
    }
    if (date_expiration !== undefined) {
      champsAMettreAJour.date_expiration = date_expiration;
    }
    if (voyages_restants !== undefined) {
      if (abonnement.typeAbonnement?.nom === 'Illimité') {
        return res.status(400).json({ message: 'Les abonnements illimités n\'ont pas de compteur de voyages à modifier.' });
      }
      champsAMettreAJour.voyages_restants = voyages_restants;
    }

    if (Object.keys(champsAMettreAJour).length === 0) {
      return res.status(400).json({ message: 'Aucun champ modifiable fourni (date_debut, date_expiration, voyages_restants).' });
    }

    await abonnement.update(champsAMettreAJour);

    logger.info(`Abonnement ${id} corrigé avec succès : ${Object.keys(champsAMettreAJour).join(', ')}.`);
    res.status(200).json({ message: 'Abonnement mis à jour avec succès.', abonnement });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'abonnement ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'abonnement.', error: error.message });
  }
};

// Renouveler un abonnement
exports.renouvelerAbonnement = async (req, res) => {
  try {
    const { id } = req.params;
    const abonnement = await Abonnement.findByPk(id, { include: { model: TypeAbonnement, as: 'typeAbonnement' } });

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé.' });
    }

    const type = abonnement.typeAbonnement;
    const dateActuelle = new Date();
    let nouvelleDateDebut = new Date();

    // Si l'abonnement n'est pas encore expiré, on prolonge à partir de la date d'expiration actuelle
    if (new Date(abonnement.date_expiration) > dateActuelle) {
      nouvelleDateDebut = new Date(abonnement.date_expiration);
    }

    const nouvelleDateExpiration = new Date(nouvelleDateDebut);
    nouvelleDateExpiration.setDate(nouvelleDateExpiration.getDate() + type.duree_validite);

    const voyagesInitiaux = type.nom === 'Illimité' ? -1 : (type.voyages_initiaux || 0);

    await abonnement.update({
      date_debut: nouvelleDateDebut,
      date_expiration: nouvelleDateExpiration,
      voyages_restants: voyagesInitiaux,
      statut: 'Actif' // Réactive l'abonnement si suspendu/résilié
    });

    logger.info(`Abonnement ${id} renouvelé avec succès. Nouveau statut : Actif. Expire le : ${nouvelleDateExpiration}`);
    res.status(200).json({ message: 'Abonnement renouvelé avec succès.', abonnement });
  } catch (error) {
    logger.error(`Erreur lors du renouvellement de l'abonnement ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors du renouvellement de l\'abonnement.', error: error.message });
  }
};

// Suspendre un abonnement
exports.suspendreAbonnement = async (req, res) => {
  try {
    const { id } = req.params;
    const abonnement = await Abonnement.findByPk(id);

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé.' });
    }

    if (abonnement.statut === 'Résilie') {
      return res.status(400).json({ message: 'Un abonnement résilié ne peut pas être suspendu.' });
    }

    await abonnement.update({ statut: 'Suspendu' });
    logger.info(`Abonnement ${id} suspendu avec succès.`);
    res.status(200).json({ message: 'Abonnement suspendu avec succès.', abonnement });
  } catch (error) {
    logger.error(`Erreur lors de la suspension de l'abonnement ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la suspension de l\'abonnement.', error: error.message });
  }
};

// Résilier un abonnement
exports.resilierAbonnement = async (req, res) => {
  try {
    const { id } = req.params;
    const abonnement = await Abonnement.findByPk(id);

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé.' });
    }

    await abonnement.update({ statut: 'Résilie' });
    logger.info(`Abonnement ${id} résilié avec succès.`);
    res.status(200).json({ message: 'Abonnement résilié avec succès.', abonnement });
  } catch (error) {
    logger.error(`Erreur lors de la résiliation de l'abonnement ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la résiliation de l\'abonnement.', error: error.message });
  }
};

// Obtenir tous les abonnements d'un utilisateur donné (via user_id) avec filtres optionnels
exports.getAbonnementsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Un client ne peut consulter que ses propres abonnements.
    if (req.user.role === 'client' && req.user.id !== user_id) {
      return res.status(403).json({ message: 'Accès refusé : vous ne pouvez consulter que vos propres abonnements.' });
    }

    const { statut, type_abonnement_id } = req.query;

    const whereClause = { user_id };
    if (statut) {
      whereClause.statut = statut;
    }
    if (type_abonnement_id) {
      whereClause.type_abonnement_id = type_abonnement_id;
    }

    const abonnements = await Abonnement.findAll({
      where: whereClause,
      include: { model: TypeAbonnement, as: 'typeAbonnement' },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(abonnements);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des abonnements de l'utilisateur ${req.params.user_id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération des abonnements de l\'utilisateur.', error: error.message });
  }
};

// Obtenir un abonnement par son ID
exports.getAbonnementById = async (req, res) => {
  try {
    const { id } = req.params;
    const abonnement = await Abonnement.findByPk(id, {
      include: { model: TypeAbonnement, as: 'typeAbonnement' }
    });

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé.' });
    }

    // Un client ne peut consulter que ses propres abonnements.
    if (req.user.role === 'client' && req.user.id !== abonnement.user_id) {
      return res.status(403).json({ message: 'Accès refusé : cet abonnement ne vous appartient pas.' });
    }

    res.status(200).json(abonnement);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'abonnement ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'abonnement.', error: error.message });
  }
};

// Consommer atomiquement un voyage sur un abonnement/ticket. Appelé exclusivement par le
// Service Billetterie lors d'une validation de QR Code : lui seul décide QUAND consommer,
// mais c'est ICI, et ici seulement, que le compteur est lu et décrémenté — dans une seule
// transaction avec verrou de ligne (SELECT ... FOR UPDATE), afin qu'un même dernier voyage
// ne puisse jamais être consommé deux fois par deux scans simultanés (cf. exigence de
// gestion des validations concurrentes).
exports.consommerVoyage = async (req, res) => {
  const t = await sequelize.transaction();
  const { id } = req.params;

  try {
    const abonnement = await Abonnement.findByPk(id, {
      include: { model: TypeAbonnement, as: 'typeAbonnement' },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!abonnement) {
      await t.rollback();
      return res.status(404).json({ message: 'Abonnement non trouvé.' });
    }

    const type = abonnement.typeAbonnement;
    const dateActuelle = new Date();

    if (abonnement.statut !== 'Actif') {
      await t.rollback();
      return res.status(403).json({ message: `L'abonnement n'est pas actif (statut : ${abonnement.statut}).` });
    }

    if (new Date(abonnement.date_debut) > dateActuelle) {
      await t.rollback();
      return res.status(403).json({ message: 'L\'abonnement n\'est pas encore valide : la date de début n\'est pas atteinte.' });
    }

    if (new Date(abonnement.date_expiration) < dateActuelle) {
      // Abonnement expiré : on corrige son statut au passage, dans la même transaction.
      await abonnement.update({ statut: 'Résilie' }, { transaction: t });
      await t.commit();
      return res.status(403).json({ message: 'L\'abonnement est expiré.' });
    }

    const estIllimite = type.nom === 'Illimité';

    if (!estIllimite && abonnement.voyages_restants <= 0) {
      await t.rollback();
      return res.status(403).json({ message: 'Solde de voyages épuisé.' });
    }

    const nouveauxVoyagesRestants = estIllimite ? abonnement.voyages_restants : abonnement.voyages_restants - 1;
    const nouveauxVoyagesConsommes = abonnement.voyages_consommes + 1;

    let nouveauStatut = abonnement.statut;
    if (!estIllimite && nouveauxVoyagesRestants === 0 && type.nom === 'Ticket simple') {
      nouveauStatut = 'Résilie';
    }

    await abonnement.update({
      voyages_restants: nouveauxVoyagesRestants,
      voyages_consommes: nouveauxVoyagesConsommes,
      statut: nouveauStatut,
    }, { transaction: t });

    await t.commit();

    logger.info(`Voyage consommé pour l'abonnement ${id}. Formule : ${type.nom}. Voyages restants : ${estIllimite ? 'illimité' : nouveauxVoyagesRestants}.`);
    res.status(200).json({ message: 'Voyage consommé.', abonnement });
  } catch (error) {
    await t.rollback();
    logger.error(`Erreur lors de la consommation d'un voyage pour l'abonnement ${id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la consommation du voyage.', error: error.message });
  }
};

// Récupérer et filtrer tous les abonnements (avec filtres avancés)
exports.getAllAbonnements = async (req, res) => {
  try {
    const {
      user_id,
      user_ids,
      statut,
      type_abonnement_id,
      date_debut_min,
      date_debut_max,
      date_expiration_min,
      date_expiration_max,
      page = 1,
      limit = 20
    } = req.query;

    const whereClause = {};

    if (user_id) {
      whereClause.user_id = user_id;
    }
    // user_ids : liste d'identifiants séparés par des virgules (ex. résultat d'une
    // recherche par nom/email côté Service Utilisateurs, à croiser avec les abonnements).
    if (user_ids) {
      const ids = String(user_ids).split(',').map((id) => id.trim()).filter(Boolean);
      whereClause.user_id = { [Op.in]: ids };
    }
    if (statut) {
      whereClause.statut = statut;
    }
    if (type_abonnement_id) {
      const ids = String(type_abonnement_id).split(',').map((id) => id.trim()).filter(Boolean);
      whereClause.type_abonnement_id = ids.length > 1 ? { [Op.in]: ids } : ids[0];
    }

    // Filtre plages de dates début
    if (date_debut_min || date_debut_max) {
      whereClause.date_debut = {};
      if (date_debut_min) {
        whereClause.date_debut[Op.gte] = new Date(date_debut_min);
      }
      if (date_debut_max) {
        whereClause.date_debut[Op.lte] = new Date(date_debut_max);
      }
    }

    // Filtre plages de dates expiration
    if (date_expiration_min || date_expiration_max) {
      whereClause.date_expiration = {};
      if (date_expiration_min) {
        whereClause.date_expiration[Op.gte] = new Date(date_expiration_min);
      }
      if (date_expiration_max) {
        whereClause.date_expiration[Op.lte] = new Date(date_expiration_max);
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const { count, rows: abonnements } = await Abonnement.findAndCountAll({
      where: whereClause,
      include: { model: TypeAbonnement, as: 'typeAbonnement' },
      limit: parsedLimit,
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      total: count,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit),
      abonnements
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération et du filtrage des abonnements :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des abonnements.', error: error.message });
  }
};
