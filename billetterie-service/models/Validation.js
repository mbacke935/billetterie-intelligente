const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const TitreTransport = require('./TitreTransport');

// Historique MÉTIER des passages (autorisés ou refusés) — distinct des logs techniques
// et de la piste d'audit. Une ligne est créée pour CHAQUE tentative de scan, y compris
// les refus, avec leur motif, conformément à l'exigence de traçabilité des refus.
const Validation = sequelize.define('Validation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  titre_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: TitreTransport, key: 'id' },
    comment: 'Peut être NULL si le QR scanné ne correspond à aucun titre connu'
  },
  client_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  abonnement_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  agent_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Identifiant de l\'agent (ou de l\'administrateur) ayant réalisé le contrôle'
  },
  date_validation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  resultat: {
    type: DataTypes.ENUM('autorise', 'refuse'),
    allowNull: false
  },
  motif_refus: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'validations',
  timestamps: false
});

Validation.belongsTo(TitreTransport, { foreignKey: 'titre_id', as: 'titre' });
TitreTransport.hasMany(Validation, { foreignKey: 'titre_id', as: 'validations' });

module.exports = Validation;
