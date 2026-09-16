const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.NODE_ENV === 'test'
  ? 'billetterie_titres_test'
  : (process.env.DB_NAME || 'billetterie_titres');

const sequelize = new Sequelize(
  dbName,
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Désactiver les logs SQL verbeux en test/prod pour la clarté
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const logger = require('./logger');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connexion à la base de données PostgreSQL établie avec succès.');
  } catch (error) {
    logger.error('Impossible de se connecter à la base de données PostgreSQL :', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
