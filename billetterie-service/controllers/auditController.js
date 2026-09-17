const { AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// GET /api/audit - Consulter la piste d'audit des opérations sensibles (admin uniquement,
// cf. exigence : "Les journaux d'audit ne doivent pas être modifiables par un agent
// standard" — ici on va plus loin, ils ne sont même pas consultables par un agent).
exports.listerAudit = async (req, res) => {
  try {
    const {
      utilisateur_id, type_action, resultat, role,
      date_min, date_max, page = 1, limit = 20,
    } = req.query;

    const whereClause = {};
    if (utilisateur_id) whereClause.utilisateur_id = utilisateur_id;
    if (type_action) whereClause.type_action = type_action;
    if (resultat) whereClause.resultat = resultat;
    if (role) whereClause.role = role;
    if (date_min || date_max) {
      whereClause.date_heure = {};
      if (date_min) whereClause.date_heure[Op.gte] = new Date(date_min);
      if (date_max) whereClause.date_heure[Op.lte] = new Date(date_max);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const { count, rows: audits } = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: parsedLimit,
      offset,
      order: [['date_heure', 'DESC']],
    });

    res.status(200).json({
      total: count,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.max(1, Math.ceil(count / parsedLimit)),
      audits,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de la piste d\'audit :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la piste d\'audit.' });
  }
};
