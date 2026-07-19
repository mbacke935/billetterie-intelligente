const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/db');
const { TypeAbonnement } = require('./models');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importation des routes
const typeAbonnementRoutes = require('./routes/typeAbonnementRoutes');
const abonnementRoutes = require('./routes/abonnementRoutes');
const voyageRoutes = require('./routes/voyageRoutes');
const validationRoutes = require('./routes/validationRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Montage des routes
app.use('/api/type-abonnements', typeAbonnementRoutes);
app.use('/api/abonnements', abonnementRoutes);
app.use('/api/voyages', voyageRoutes);
app.use('/api/validations', validationRoutes);
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
      console.log('Seeding des formules d\'abonnement par défaut...');
      await TypeAbonnement.bulkCreate([
        {
          nom: 'Ticket simple',
          tarif: 2.00,
          duree_validite: 1, // 1 jour
          voyages_initiaux: 1
        },
        {
          nom: 'Limité',
          tarif: 15.00,
          duree_validite: 7, // 7 jours
          voyages_initiaux: 10
        },
        {
          nom: 'Illimité',
          tarif: 50.00,
          duree_validite: 30, // 30 jours
          voyages_initiaux: null
        }
      ]);
      console.log('Formules d\'abonnement créées avec succès.');
    }
  } catch (error) {
    console.error('Erreur lors du seeding des données par défaut :', error);
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
      console.log('Modèles Sequelize synchronisés avec la base de données.');

      // Remplir les données par défaut si nécessaire
      await seedDefaultData();

      app.listen(PORT, () => {
        console.log(`Le Service Abonnements écoute sur le port ${PORT}`);
      });
    } catch (error) {
      console.error('Échec du démarrage du serveur :', error);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = { app, seedDefaultData };

