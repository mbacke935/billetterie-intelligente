import axios from 'axios';

// Service API pour les abonnements
// Port 5001 = microservice abonnements de MS
const apiAbonnements = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur pour ajouter le token JWT
apiAbonnements.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Types d'abonnements ──────────────────────────────────────
export const getTypesAbonnements = () => apiAbonnements.get('/types');
export const creerTypeAbonnement = (data) => apiAbonnements.post('/types', data);

// ── Abonnements ──────────────────────────────────────────────
export const getAbonnements = () => apiAbonnements.get('/abonnements');
export const getAbonnementById = (id) => apiAbonnements.get(`/abonnements/${id}`);
export const creerAbonnement = (data) => apiAbonnements.post('/abonnements', data);
export const suspendreAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/suspendre`);
export const renouvelerAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/renouveler`);
export const resilierAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/resilier`);
export const verifierAbonnement = (id) => apiAbonnements.get(`/abonnements/${id}/valider`);

// ── Voyages ──────────────────────────────────────────────────
export const getVoyages = () => apiAbonnements.get('/voyages');
export const getVoyagesByAbonnement = (id) => apiAbonnements.get(`/voyages/abonnement/${id}`);

// ── Statistiques ─────────────────────────────────────────────
export const getStatsAbonnements = () => apiAbonnements.get('/stats');

export default apiAbonnements;