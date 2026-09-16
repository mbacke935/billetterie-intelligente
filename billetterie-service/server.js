const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/db');
const logger = require('./config/logger');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de journalisation technique des requêtes HTTP (distinct de l'historique
// métier des validations et de la piste d'audit — cf. config/logger.js).
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
const titresRoutes = require('./routes/titresRoutes');
const validationsRoutes = require('./routes/validationsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Toutes les routes /api nécessitent le JWT émis par le Service Utilisateurs
// (le /health public reste accessible sans authentification pour le monitoring)
app.use('/api', authMiddleware);

// Montage des routes
app.use('/api/titres', titresRoutes);
app.use('/api/validations', validationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/stats', statsRoutes);

// Route de base/santé
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'billetterie-service',
    timestamp: new Date()
  });
});

// Port d'écoute
const PORT = process.env.PORT || 5002;

// Démarrage du serveur et synchronisation BDD (seulement si ce n'est pas le mode test)
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      // Connexion à PostgreSQL
      await connectDB();

      // Synchronisation des tables (création si non existantes)
      await sequelize.sync({ alter: true });
      logger.info('Modèles Sequelize synchronisés avec la base de données.');

      app.listen(PORT, () => {
        logger.info(`Le Service Billetterie écoute sur le port ${PORT}`);
      });
    } catch (error) {
      logger.error('Échec du démarrage du serveur :', error);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = { app };
