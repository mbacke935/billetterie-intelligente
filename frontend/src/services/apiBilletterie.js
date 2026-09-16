import axios from 'axios';

const apiBilletterie = axios.create({
  baseURL: 'http://localhost:5002/api',
  headers: { 'Content-Type': 'application/json' },
});

apiBilletterie.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Titres de transport / QR Codes ────────────────────────────
export const genererTitre = (data) => apiBilletterie.post('/titres', data);
export const getTitres = (params) => apiBilletterie.get('/titres', { params });
export const getTitreById = (id) => apiBilletterie.get(`/titres/${id}`);
export const getTitreParAbonnement = (abonnementId) => apiBilletterie.get(`/titres/by-abonnement/${abonnementId}`);
export const getTitreQrCode = (id) => apiBilletterie.get(`/titres/${id}/qrcode`);
export const activerTitre = (id) => apiBilletterie.put(`/titres/${id}/activer`);
export const desactiverTitre = (id) => apiBilletterie.put(`/titres/${id}/desactiver`);

// ── Scan et validation ────────────────────────────────────────
export const scannerQrCode = (qrData) => apiBilletterie.post('/validations/scanner', { qrData });
export const validerManuellement = (titreId) => apiBilletterie.post('/validations/manuelle', { titre_id: titreId });

// ── Historique des validations ───────────────────────────────
export const getValidations = (params) => apiBilletterie.get('/validations', { params });
export const getValidationsParClient = (clientId) => apiBilletterie.get(`/validations/client/${clientId}`);

// ── Audit (admin) ─────────────────────────────────────────────
export const getAudit = (params) => apiBilletterie.get('/audit', { params });

// ── Statistiques ─────────────────────────────────────────────
export const getStatsBilletterie = () => apiBilletterie.get('/stats');

export default apiBilletterie;
