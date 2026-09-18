// backend/tests/users.test.js
// Mock de l'envoi d'email pour éviter les erreurs SMTP pendant les tests
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

// ... reste du code de tests/users.test.js ...

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

let token;
let mongod;

// CONFIGURATION GLOBALE DES TESTS

// Exécuté une seule fois avant tous les tests
beforeAll(async () => {
  jest.setTimeout(30000);

  // 1. Démarrage du serveur MongoDB virtuel en mémoire
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // 2. Connexion Mongoose au serveur virtuel
  await mongoose.connect(uri);

  // 3. Nettoyage : supprimer les comptes de test s'ils existent déjà
  await User.deleteMany({ email: { $in: ['supertest@test.com', 'admin@billetterie.com'] } });

  // 4. Création du compte administrateur requis pour les tests
  const hashedPassword = await bcrypt.hash('Admin1234', 10);
  await User.create({
    nom: 'Admin',
    prenom: 'Systeme',
    email: 'admin@billetterie.com',
    telephone: '770000000',
    role: 'admin',
    motDePasse: hashedPassword,
    statut: 'actif'
  });

  // 5. Récupération du token JWT de l'administrateur
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@billetterie.com', motDePasse: 'Admin1234' });

  token = res.body.token;
});

// Exécuté une seule fois après tous les tests
afterAll(async () => {
  // Nettoyage et fermeture propre
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({ email: { $in: ['supertest@test.com', 'admin@billetterie.com'] } });
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
});

// ═══════════════════════════════════════════════════════════════
// TESTS API — SERVICE UTILISATEURS
// ═══════════════════════════════════════════════════════════════

// ── TC-001 : Scénario nominal — Login réussi ───────────────
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
it('TC-002 : mauvais mot de passe → 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@billetterie.com', motDePasse: 'mauvais' });

  expect(res.status).toBe(401);
});

// ── TC-003 : Scénario d'erreur — Champ manquant ───────────
it('TC-003 : email manquant → 400', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ motDePasse: 'Admin1234' });

  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/requis/i);
});

// ── TC-004 : Scénario nominal — Création d'un utilisateur ──
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
  expect(res.body.user.email).toBe('supertest@test.com');
});

// ── TC-005 : Scénario nominal — Statistiques complètes ─────
it('TC-005 : stats avec token → 200 + toutes les sections', async () => {
  const res = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
});