const { Voyage, Abonnement, TypeAbonnement } = require('../models');

// Récupérer l'historique complet des consommations de voyages pour un utilisateur (via son user_id)
exports.getVoyagesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Étape 1 : Récupérer tous les abonnements du client
    const abonnements = await Abonnement.findAll({
      where: { user_id },
      attributes: ['id']
    });

    if (!abonnements || abonnements.length === 0) {
      return res.status(200).json([]);
    }

    const abonnementIds = abonnements.map(ab => ab.id);

    // Étape 2 : Récupérer les voyages pour ces abonnements
    const voyages = await Voyage.findAll({
      where: { abonnement_id: abonnementIds },
      include: [
        {
          model: Abonnement,
          as: 'abonnement',
          attributes: ['id', 'user_id', 'statut'],
          include: [
            {
              model: TypeAbonnement,
              as: 'typeAbonnement',
              attributes: ['nom']
            }
          ]
        }
      ],
      order: [['date_voyage', 'DESC']]
    });

    res.status(200).json(voyages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des voyages de l\'utilisateur.', error: error.message });
  }
};

// Récupérer l'historique des voyages pour un abonnement spécifique (via abonnement_id)
exports.getVoyagesByAbonnement = async (req, res) => {
  try {
    const { abonnement_id } = req.params;

    const abonnement = await Abonnement.findByPk(abonnement_id);
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé.' });
    }

    const voyages = await Voyage.findAll({
      where: { abonnement_id },
      order: [['date_voyage', 'DESC']]
    });

    res.status(200).json(voyages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des voyages de l\'abonnement.', error: error.message });
  }
};
