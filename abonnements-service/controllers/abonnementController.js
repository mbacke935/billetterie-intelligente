const { Abonnement, TypeAbonnement } = require('../models');

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

    res.status(201).json(nouvelAbonnement);
  } catch (error) {
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

    res.status(200).json({ message: 'Abonnement renouvelé avec succès.', abonnement });
  } catch (error) {
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
    res.status(200).json({ message: 'Abonnement suspendu avec succès.', abonnement });
  } catch (error) {
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
    res.status(200).json({ message: 'Abonnement résilié avec succès.', abonnement });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la résiliation de l\'abonnement.', error: error.message });
  }
};

// Obtenir tous les abonnements d'un utilisateur donné (via user_id)
exports.getAbonnementsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const abonnements = await Abonnement.findAll({
      where: { user_id },
      include: { model: TypeAbonnement, as: 'typeAbonnement' }
    });
    res.status(200).json(abonnements);
  } catch (error) {
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
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'abonnement.', error: error.message });
  }
};
