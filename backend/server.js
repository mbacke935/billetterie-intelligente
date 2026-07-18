const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const profileRoutes = require('./routes/profileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Billetterie Intelligente fonctionne !' });
});

// Démarrer le serveur seulement si ce fichier est exécuté directement
// (pas lors des tests avec Supertest)
if (require.main === module) {
  connectDB().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  });
}

module.exports = { app, connectDB };