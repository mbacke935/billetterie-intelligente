const { sequelize } = require('../config/db');
const TypeAbonnement = require('./TypeAbonnement');
const Abonnement = require('./Abonnement');
const Voyage = require('./Voyage');

// Associations
TypeAbonnement.hasMany(Abonnement, {
  foreignKey: 'type_abonnement_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Abonnement.belongsTo(TypeAbonnement, {
  foreignKey: 'type_abonnement_id',
  as: 'typeAbonnement'
});

Abonnement.hasMany(Voyage, {
  foreignKey: 'abonnement_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Voyage.belongsTo(Abonnement, {
  foreignKey: 'abonnement_id',
  as: 'abonnement'
});

module.exports = {
  sequelize,
  TypeAbonnement,
  Abonnement,
  Voyage
};
