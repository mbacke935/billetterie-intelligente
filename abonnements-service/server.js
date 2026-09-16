const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/db');
const { TypeAbonnement } = require('./models');
const logger = require('./config/logger');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de journalisation des requêtes HTTP
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration
    });
  });
  next();
});

// Importation des routes
// Le scan/validation des QR Codes et l'historique des voyages/validations relèvent
// désormais exclusivement du Service Billetterie, séparé de ce service.
const typeAbonnementRoutes = require('./routes/typeAbonnementRoutes');
const abonnementRoutes = require('./routes/abonnementRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Toutes les routes /api nécessitent le JWT émis par le Service Utilisateurs
// (le /health public reste accessible sans authentification pour le monitoring)
app.use('/api', authMiddleware);

// Montage des routes
app.use('/api/type-abonnements', typeAbonnementRoutes);
app.use('/api/abonnements', abonnementRoutes);
app.use('/api/stats', statsRoutes);

// Route de base/santé
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'abonnements-service',
    timestamp: new Date()
  });
});

// Port d'écoute
const PORT = process.env.PORT || 5001;

// Fonction d'initialisation et seeding par défaut des types d'abonnements
const seedDefaultData = async () => {
  try {
    const count = await TypeAbonnement.count();
    if (count === 0) {
      logger.info('Seeding des formules d\'abonnement par défaut...');
      await TypeAbonnement.bulkCreate([
        {
          nom: 'Ticket simple',
          tarif: 500.00,
          duree_validite: 1, // 1 jour
          voyages_initiaux: 1
        },
        {
          nom: 'Limité',
          tarif: 5000.00,
          duree_validite: 7, // 7 jours
          voyages_initiaux: 10
        },
        {
          nom: 'Illimité',
          tarif: 15000.00,
          duree_validite: 30, // 30 jours
          voyages_initiaux: null
        }
      ]);
      logger.info('Formules d\'abonnement créées avec succès.');
    }
  } catch (error) {
    logger.error('Erreur lors du seeding des données par défaut :', error);
  }
};

// Démarrage du serveur et synchronisation BDD (seulement si ce n'est pas le mode test)
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      // Connexion à MySQL
      await connectDB();

      // Synchronisation des tables (création si non existantes)
      await sequelize.sync({ alter: true });
      logger.info('Modèles Sequelize synchronisés avec la base de données.');

      // Remplir les données par défaut si nécessaire
      await seedDefaultData();

      app.listen(PORT, () => {
        logger.info(`Le Service Abonnements écoute sur le port ${PORT}`);
      });
    } catch (error) {
      logger.error('Échec du démarrage du serveur :', error);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = { app, seedDefaultData };

