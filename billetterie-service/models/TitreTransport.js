const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Un "titre de transport" est le pendant, côté Service Billetterie, d'un ticket ou d'un
// abonnement attribué côté Service Abonnements : c'est LUI qui porte le QR Code et son
// propre statut (actif/désactivé), indépendamment du statut de l'abonnement d'origine.
// Le Service Billetterie ne connaît le client et l'abonnement que par leur identifiant
// (client_id, abonnement_id) — jamais par un accès direct aux bases des autres services.
const TitreTransport = sequelize.define('TitreTransport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  client_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Identifiant du client, provenant du Service Utilisateurs (ObjectId Mongo)'
  },
  abonnement_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Identifiant de l\'abonnement/ticket, provenant du Service Abonnements'
  },
  // Copie du nom de formule au moment de la génération, à des fins d'affichage rapide
  // (liste des titres) sans avoir à interroger le Service Abonnements à chaque fois.
  type_titre: {
    type: DataTypes.ENUM('Ticket simple', 'Limité', 'Illimité'),
    allowNull: false
  },
  date_expiration: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('actif', 'desactive'),
    allowNull: false,
    defaultValue: 'actif'
  }
}, {
  tableName: 'titres_transport',
  timestamps: true,
  createdAt: 'date_creation',
  updatedAt: 'date_maj'
});

module.exports = TitreTransport;
