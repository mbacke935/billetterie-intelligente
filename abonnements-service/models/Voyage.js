const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Abonnement = require('./Abonnement');

const Voyage = sequelize.define('Voyage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  abonnement_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Abonnement,
      key: 'id'
    }
  },
  date_voyage: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  validation_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ID de validation unique généré lors du passage/validation'
  }
}, {
  tableName: 'voyages',
  timestamps: false
});

module.exports = Voyage;
