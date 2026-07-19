const { Abonnement, TypeAbonnement, Voyage, sequelize } = require('../models');
const { Op } = require('sequelize');

// Récupérer les statistiques globales et indicateurs clés
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

    // 3. Volume total de voyages consommés (somme de la table Abonnement et nombre d'entrées table Voyage)
    const totalVoyagesEnregistres = await Voyage.count();
    
    const sommeVoyagesConsommes = await Abonnement.sum('voyages_consommes') || 0;

    // 4. Nombre total de clients uniques ayant un abonnement
    const totalClientsUniques = await Abonnement.count({
      distinct: true,
      col: 'user_id'
    });

    // 5. Évolution des voyages validés sur les 7 derniers jours
    const septJoursAvant = new Date();
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);

    // Fonction de formatage spécifique selon le dialecte de BDD (ici MySQL)
    const voyagesParJour = await Voyage.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date_voyage')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      where: {
        date_voyage: {
          [Op.gte]: septJoursAvant
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('date_voyage'))],
      order: [[sequelize.fn('DATE', sequelize.col('date_voyage')), 'ASC']],
      raw: true
    });

    res.status(200).json({
      indicateurs: {
        total_abonnements: await Abonnement.count(),
        total_clients_uniques: totalClientsUniques,
        total_voyages_valides: totalVoyagesEnregistres,
        somme_voyages_consommes_declaratifs: sommeVoyagesConsommes
      },
      repartition_par_statut: statsStatut,
      repartition_par_formule: statsType,
      evolution_voyages_7_jours: voyagesParJour
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du calcul des indicateurs statistiques.', error: error.message });
  }
};
