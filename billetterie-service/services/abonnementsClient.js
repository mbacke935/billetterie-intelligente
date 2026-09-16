const axios = require('axios');
const logger = require('../config/logger');

const ABONNEMENTS_SERVICE_URL = process.env.ABONNEMENTS_SERVICE_URL || 'http://localhost:5001';

// Le Service Billetterie ne stocke ni ne lit jamais directement la base MySQL du Service
// Abonnements : toute lecture ou consommation de voyage passe par son API REST.

// Récupère l'état courant d'un abonnement/ticket (statut, dates, formule, compteurs).
const obtenirAbonnement = async (abonnementId, token) => {
  try {
    const { data } = await axios.get(`${ABONNEMENTS_SERVICE_URL}/api/abonnements/${abonnementId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    logger.error(`Erreur de communication avec le Service Abonnements (GET /abonnements/${abonnementId}) :`, error.message);
    throw new Error('SERVICE_ABONNEMENTS_INDISPONIBLE');
  }
};

// Demande au Service Abonnements de consommer atomiquement un voyage. C'est LUI qui décide
// (et verrouille sa propre ligne en base) : le Service Billetterie ne fait que relayer la
// décision, il ne décrémente jamais un compteur qui ne lui appartient pas.
// Retourne { autorise: boolean, raison?: string, abonnement?: {...} }.
const consommerVoyage = async (abonnementId, token) => {
  try {
    const { data } = await axios.post(
      `${ABONNEMENTS_SERVICE_URL}/api/abonnements/${abonnementId}/consommer-voyage`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
    );
    return { autorise: true, abonnement: data.abonnement };
  } catch (error) {
    if (error.response && error.response.status === 403) {
      return { autorise: false, raison: error.response.data?.message || 'Voyage refusé par le Service Abonnements.' };
    }
    if (error.response?.status === 404) {
      return { autorise: false, raison: 'Abonnement introuvable.' };
    }
    logger.error(`Erreur de communication avec le Service Abonnements (POST /abonnements/${abonnementId}/consommer-voyage) :`, error.message);
    throw new Error('SERVICE_ABONNEMENTS_INDISPONIBLE');
  }
};

module.exports = { obtenirAbonnement, consommerVoyage };
