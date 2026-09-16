const { Abonnement, TypeAbonnement, sequelize } = require('../models');
const logger = require('../config/logger');

// Récupérer les statistiques globales et indicateurs clés
// Note : le volume de voyages validés/refusés et son évolution dans le temps relèvent
// désormais du Service Billetterie (table `validations`), seul propriétaire de cet
// historique depuis la séparation des deux services.
exports.getGlobalStats = async (req, res) => {
  try {
    // 1. Répartition des abonnements par statut (Actif, Suspendu, Résilié)
    const statsStatut = await Abonnement.findAll({
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['statut']
    });

    // 2. Nombre d'abonnements par type (formule)
    const statsType = await Abonnement.findAll({
      attributes: [
        [sequelize.col('typeAbonnement.nom'), 'type_nom'],
        [sequelize.fn('COUNT', sequelize.col('Abonnement.id')), 'total']
      ],
      include: [
        {
          model: TypeAbonnement,
          as: 'typeAbonnement',
          attributes: []
        }
      ],
      group: ['typeAbonnement.nom'],
      raw: true
    });

    // 3. Volume de voyages consommés déclaré par les abonnements eux-mêmes
    const sommeVoyagesConsommes = await Abonnement.sum('voyages_consommes') || 0;

    // 4. Nombre total de clients uniques ayant un abonnement
    const totalClientsUniques = await Abonnement.count({
      distinct: true,
      col: 'user_id'
    });

    res.status(200).json({
      indicateurs: {
        total_abonnements: await Abonnement.count(),
        total_clients_uniques: totalClientsUniques,
        somme_voyages_consommes_declaratifs: sommeVoyagesConsommes
      },
      repartition_par_statut: statsStatut,
      repartition_par_formule: statsType
    });

  } catch (error) {
    logger.error('Erreur lors du calcul des indicateurs statistiques :', error);
    res.status(500).json({ message: 'Erreur lors du calcul des indicateurs statistiques.', error: error.message });
  }
};
