const { AuditLog } = require('../models');
const logger = require('../config/logger');

// Enregistre une entrée d'audit pour une opération sensible. N'échoue jamais l'appelant :
// un problème d'écriture d'audit ne doit pas bloquer l'opération métier elle-même, il est
// seulement journalisé techniquement pour investigation.
const enregistrerAudit = async ({ utilisateurId, role, typeAction, ressourceId, resultat, req }) => {
  try {
    await AuditLog.create({
      utilisateur_id: utilisateurId,
      role,
      type_action: typeAction,
      ressource_id: ressourceId ? String(ressourceId) : null,
      resultat,
      ip_adresse: req?.ip || req?.headers?.['x-forwarded-for'] || null,
    });
  } catch (error) {
    logger.error(`Échec de l'enregistrement d'audit (${typeAction}) :`, error);
  }
};

module.exports = { enregistrerAudit };
