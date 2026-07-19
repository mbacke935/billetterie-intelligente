const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const TypeAbonnement = require('./TypeAbonnement');

const Abonnement = sequelize.define('Abonnement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ID de l\'utilisateur/client provenant du service externe'
  },
  type_abonnement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: TypeAbonnement,
      key: 'id'
    }
  },
  date_debut: {
    type: DataTypes.DATE,
    allowNull: false
  },
  date_expiration: {
    type: DataTypes.DATE,
    allowNull: false
  },
  voyages_restants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Nombre de voyages restants (décrémenté lors de chaque validation si limité)'
  },
  voyages_consommes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Nombre total de voyages consommés'
  },
  statut: {
    type: DataTypes.ENUM('Actif', 'Suspendu', 'Résilie'),
    defaultValue: 'Actif',
    allowNull: false
  }
}, {
  tableName: 'abonnements',
  timestamps: true
});

module.exports = Abonnement;
