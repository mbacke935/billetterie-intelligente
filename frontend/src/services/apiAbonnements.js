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
export const getAllAbonnements = (params) => apiAbonnements.get('/abonnements', { params });
export const getAbonnementsByUser = (userId) => apiAbonnements.get(`/abonnements/user/${userId}`);
export const getAbonnementById = (id) => apiAbonnements.get(`/abonnements/${id}`);
export const creerAbonnement = (data) => apiAbonnements.post('/abonnements', data);
export const suspendreAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/suspendre`);
export const renouvelerAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/renouveler`);
export const resilierAbonnement = (id) => apiAbonnements.put(`/abonnements/${id}/resilier`);

// Note : la génération/lecture de QR Code, la validation d'un voyage et l'historique des
// voyages/validations relèvent désormais du Service Billetterie (voir services/apiBilletterie.js),
// un microservice séparé avec sa propre base de données.

// ── Statistiques ─────────────────────────────────────────────
export const getStatsAbonnements = () => apiAbonnements.get('/stats/global');

export default apiAbonnements;