const axios = require('axios');
const logger = require('../config/logger');

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:5000';

// Le Service Billetterie ne stocke ni ne lit jamais directement la base MongoDB du Service
// Utilisateurs : toute vérification passe par son API REST, avec le token de la requête en
// cours (le Service Utilisateurs authentifie et autorise lui-même l'appel).
const obtenirUtilisateur = async (userId, token) => {
  try {
    const { data } = await axios.get(`${USERS_SERVICE_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    logger.error(`Erreur de communication avec le Service Utilisateurs (GET /users/${userId}) :`, error.message);
    throw new Error('SERVICE_UTILISATEURS_INDISPONIBLE');
  }
};

module.exports = { obtenirUtilisateur };
