const { Abonnement, TypeAbonnement } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// Attribuer un abonnement à un utilisateur
exports.attribuerAbonnement = async (req, res) => {
  try {
    const { user_id, type_abonnement_id } = req.body;

    if (!user_id || !type_abonnement_id) {
      return res.status(400).json({ message: 'user_id et type_abonnement_id sont requis.' });
    }

    const type = await TypeAbonnement.findByPk(type_abonnement_id);
    if (!type) {
      return res.status(404).json({ message: 'Type d\'abonnement non trouvé.' });
    }

    const dateDebut = new Date();
    const dateExpiration = new Date();
    dateExpiration.setDate(dateDebut.getDate() + type.duree_validite);

    // Si illimité, voyages_restants est défini à -1
    const voyagesRestants = type.nom === 'Illimité' ? -1 : (type.voyages_initiaux || 0);

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

    res.status(200).json(abonnement);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'abonnement ${req.params.id} :`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'abonnement.', error: error.message });
  }
};

// Récupérer et filtrer tous les abonnements (avec filtres avancés)
exports.getAllAbonnements = async (req, res) => {
  try {
    const {
      user_id,
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
    if (statut) {
      whereClause.statut = statut;
    }
    if (type_abonnement_id) {
      whereClause.type_abonnement_id = type_abonnement_id;
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
