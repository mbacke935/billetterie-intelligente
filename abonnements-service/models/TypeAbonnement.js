const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Champs configurables d'une formule d'abonnement (via le CRUD de typeAbonnementController) :
// - nom : identifie la formule commerciale ('Ticket simple', 'Limité' ou 'Illimité')
// - tarif : prix en euros facturé au client pour cette formule
// - duree_validite : durée de validité en jours à partir de la date de début
// - voyages_initiaux : nombre de voyages accordés à l'attribution (ignoré/NULL pour 'Illimité')
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
  },
  actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Archivage logique : une formule désactivée reste consultable via son historique mais ne peut plus être attribuée'
  }
}, {
  tableName: 'type_abonnements',
  timestamps: true
});

module.exports = TypeAbonnement;
