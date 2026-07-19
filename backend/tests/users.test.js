const request = require('supertest');
const { app, connectDB } = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

let token;


// CONFIGURATION GLOBALE DES TESTS


// Exécuté une seule fois avant tous les tests
beforeAll(async () => {
  // 1. Connexion à la base de données MongoDB
  await connectDB();

  // 2. Nettoyage : supprimer l'utilisateur de test s'il existe déjà
  await User.deleteOne({ email: 'supertest@test.com' });

  // 3. Récupération du token JWT de l'administrateur
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@billetterie.com', motDePasse: 'Admin1234' });

  token = res.body.token;
});

// Exécuté une seule fois après tous les tests
afterAll(async () => {
  // Fermeture propre de la connexion MongoDB
  await mongoose.connection.close();
});

// ═══════════════════════════════════════════════════════════════
// TESTS API — SERVICE UTILISATEURS
// ═══════════════════════════════════════════════════════════════

// ── TC-001 : Scénario nominal — Login réussi ───────────────
// Vérifie qu'un login avec des identifiants corrects retourne
// un token JWT et les informations de l'utilisateur (sans mdp)
it('TC-001 : login réussi → 200 + token JWT', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@billetterie.com', motDePasse: 'Admin1234' });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('token');
  expect(res.body.user.role).toBe('admin');
  expect(res.body.user).not.toHaveProperty('motDePasse');
});

// ── TC-002 : Scénario d'erreur — Mauvais mot de passe ─────
// Vérifie que le serveur refuse l'accès si le mot de passe
// est incorrect (401 Unauthorized)
it('TC-002 : mauvais mot de passe → 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@billetterie.com', motDePasse: 'mauvais' });

  expect(res.status).toBe(401);
});

// ── TC-003 : Scénario d'erreur — Champ manquant ───────────
// Vérifie que le serveur retourne 400 si l'email est absent
// du corps de la requête
it('TC-003 : email manquant → 400', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ motDePasse: 'Admin1234' });

  expect(res.status).toBe(400);
  expect(res.body.message).toBe('Email et mot de passe requis.');
});

// ── TC-004 : Scénario nominal — Création d'un utilisateur ──
// Vérifie qu'un administrateur peut créer un nouvel utilisateur
// et que la réponse contient les bonnes données
it('TC-004 : admin peut créer un utilisateur → 201', async () => {
  const res = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nom: 'Test',
      prenom: 'Supertest',
      email: 'supertest@test.com',
      telephone: '0699999999',
      role: 'client',
      motDePasse: 'Test1234'
    });

  expect(res.status).toBe(201);
  expect(res.body.message).toBe('Utilisateur créé avec succès.');
  expect(res.body.user.email).toBe('supertest@test.com');
});

// ── TC-005 : Scénario nominal — Statistiques complètes ─────
// Vérifie que la route retourne toutes les sections attendues
// (admins, agents, clients, global) avec un total > 0
it('TC-005 : stats avec token → 200 + toutes les sections', async () => {
  const res = await request(app)
    .get('/api/stats')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('admins');
  expect(res.body).toHaveProperty('agents');
  expect(res.body).toHaveProperty('clients');
  expect(res.body).toHaveProperty('global');
  expect(res.body.global.total).toBeGreaterThan(0);
});