const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.NODE_ENV === 'test'
  ? 'billetterie_abonnements_test'
  : (process.env.DB_NAME || 'billetterie_abonnements');

const sequelize = new Sequelize(
  dbName,
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Désactiver les logs SQL verbeux en test/prod pour la clarté
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données MySQL établie avec succès.');
  } catch (error) {
    console.error('Impossible de se connecter à la base de données MySQL :', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
