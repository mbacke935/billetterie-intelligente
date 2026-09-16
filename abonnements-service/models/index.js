const { sequelize } = require('../config/db');
const TypeAbonnement = require('./TypeAbonnement');
const Abonnement = require('./Abonnement');

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

module.exports = {
  sequelize,
  TypeAbonnement,
  Abonnement
};
