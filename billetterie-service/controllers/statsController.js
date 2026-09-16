const { TitreTransport, Validation, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// GET /api/stats - Indicateurs du tableau de bord du Service Billetterie.
// Choix justifiés : le cœur du service est le couple génération de titres / validation
// de voyages, donc les indicateurs retenus couvrent (1) le volume et l'état des titres en
// circulation, (2) le taux de réussite des validations (santé du service côté agents), et
// (3) les motifs de refus les plus fréquents (utile pour détecter un abus ou un problème
// récurrent — QR falsifiés, abonnements expirés en masse, etc.).
exports.getGlobalStats = async (req, res) => {
  try {
    const totalTitres = await TitreTransport.count();
    const titresActifs = await TitreTransport.count({ where: { statut: 'actif' } });
    const titresDesactives = await TitreTransport.count({ where: { statut: 'desactive' } });

    const repartitionParType = await TitreTransport.findAll({
      attributes: ['type_titre', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['type_titre'],
      raw: true,
    });

    const totalValidations = await Validation.count();
    const validationsAutorisees = await Validation.count({ where: { resultat: 'autorise' } });
    const validationsRefusees = await Validation.count({ where: { resultat: 'refuse' } });
    const tauxRefus = totalValidations > 0 ? Number(((validationsRefusees / totalValidations) * 100).toFixed(1)) : 0;

    const motifsRefus = await Validation.findAll({
      attributes: ['motif_refus', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      where: { resultat: 'refuse' },
      group: ['motif_refus'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true,
    });

    const septJoursAvant = new Date();
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);

    const evolution7Jours = await Validation.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date_validation')), 'date'],
        'resultat',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      ],
      where: { date_validation: { [Op.gte]: septJoursAvant } },
      group: [sequelize.fn('DATE', sequelize.col('date_validation')), 'resultat'],
      order: [[sequelize.fn('DATE', sequelize.col('date_validation')), 'ASC']],
      raw: true,
    });

    res.status(200).json({
      indicateurs: {
        total_titres: totalTitres,
        titres_actifs: titresActifs,
        titres_desactives: titresDesactives,
        total_validations: totalValidations,
        validations_autorisees: validationsAutorisees,
        validations_refusees: validationsRefusees,
        taux_refus_pourcent: tauxRefus,
      },
      repartition_par_type_titre: repartitionParType,
      top_motifs_refus: motifsRefus,
      evolution_validations_7_jours: evolution7Jours,
    });
  } catch (error) {
    logger.error('Erreur lors du calcul des indicateurs statistiques :', error);
    res.status(500).json({ message: 'Erreur lors du calcul des indicateurs statistiques.' });
  }
};
