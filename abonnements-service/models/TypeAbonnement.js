const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TypeAbonnement = sequelize.define('TypeAbonnement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Ticket simple', 'Limité', 'Illimité']]
    }
  },
  tarif: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  duree_validite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Durée de validité en jours',
    validate: {
      min: 1
    }
  },
  voyages_initiaux: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Nombre de voyages initiaux, NULL si formule illimitée',
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'type_abonnements',
  timestamps: true
});

module.exports = TypeAbonnement;
