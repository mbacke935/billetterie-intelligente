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
  },
  voyages_restants_avant: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Voyages restants juste avant cette validation (-1 = illimité)'
  },
  voyages_restants_apres: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Voyages restants juste après cette validation (-1 = illimité)'
  }
}, {
  tableName: 'voyages',
  timestamps: false
});

module.exports = Voyage;
