const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Piste d'audit des opérations SENSIBLES (génération, désactivation/réactivation d'un
// titre, validation manuelle par identifiant). Objectif : pouvoir déterminer qui a fait
// quoi, sur quelle ressource, quand, avec quel résultat. Volontairement en lecture seule
// pour les agents : seul un administrateur peut la consulter (voir middlewares/role).
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  utilisateur_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type_action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Ex. GENERATION_TITRE, DESACTIVATION_TITRE, REACTIVATION_TITRE, VALIDATION_MANUELLE'
  },
  ressource_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Identifiant du titre, du QR Code ou de la validation concernée'
  },
  date_heure: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  resultat: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'SUCCES ou ECHEC'
  },
  ip_adresse: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: false
});

module.exports = AuditLog;
