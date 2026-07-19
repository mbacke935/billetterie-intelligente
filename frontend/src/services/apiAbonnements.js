import axios from 'axios';

const apiAbonnements = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
});

apiAbonnements.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Types d'abonnements ──────────────────────────────────────
export const getTypesAbonnements = () => apiAbonnements.get('/type-abonnements');
export const creerTypeAbonnement = (data) => apiAbonnements.post('/type-abonnements', data);

// ── Abonnements ──────────────────────────────────────────────
export const getAbonnementsByUser = (userId) => apiAbonnements.get(`/abonnements/user/${userId}`);
export const getAbonnementById = (id) => apiAbonnements.get(`/abonnements/${id}`);
export const creerAbonnement = (data) => apiAbonnements.post('/abonnements', data);
export const suspendreAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/suspendre`);
export const renouvelerAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/renouveler`);
export const resilierAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/resilier`);

// ── Voyages ──────────────────────────────────────────────────
export const getVoyagesByUser = (userId) => apiAbonnements.get(`/voyages/user/${userId}`);
export const getVoyagesByAbonnement = (id) => apiAbonnements.get(`/voyages/abonnement/${id}`);

// ── Statistiques ─────────────────────────────────────────────
export const getStatsAbonnements = () => apiAbonnements.get('/stats');

export default apiAbonnements;