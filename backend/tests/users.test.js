const request = require('supertest');
const { app, connectDB } = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

let token;
let userId;

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION GLOBALE DES TESTS
// ═══════════════════════════════════════════════════════════════

// Exécuté une seule fois avant tous les tests
beforeAll(async () => {
  // 1. Connexion à la base de données MongoDB
  await connectDB();

  // 2. Nettoyage : supprimer l'utilisateur de test s'il existe déjà
  //    (évite les erreurs de doublon lors de relances successives)
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
// SUITE 1 — AUTHENTIFICATION
// Teste les routes /api/auth/login et /api/auth/logout
// Scénarios : login réussi, mauvais mot de passe,
//             champs manquants, accès sans token
// ═══════════════════════════════════════════════════════════════
describe('Authentification', () => {

  // ── TC-001 : Scénario nominal ──────────────────────────────
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

  // ── TC-004 : Scénario d'erreur — Accès sans token JWT ─────
  // Vérifie que le middleware authMiddleware bloque l'accès
  // aux routes protégées sans token (401 Unauthorized)
  it('TC-004 : accès route protégée sans token → 401', async () => {
    const res = await request(app)
      .get('/api/users');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Accès refusé. Aucun token fourni.');
  });

});

// ═══════════════════════════════════════════════════════════════
// SUITE 2 — GESTION DES UTILISATEURS
// Teste les routes /api/users
// Scénarios : création, doublon, listing, filtrage par rôle,
//             recherche par email, activation, blocage,
//             suppression, utilisateur inexistant
// ═══════════════════════════════════════════════════════════════
describe('Gestion des utilisateurs', () => {

  // ── TC-005 : Scénario nominal — Création d'un utilisateur ──
  // Vérifie qu'un administrateur peut créer un nouvel utilisateur
  // et que la réponse contient les bonnes données (sans mdp)
  it('TC-005 : admin peut créer un utilisateur → 201', async () => {
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

    // Sauvegarder l'ID pour les tests suivants (activation, blocage, suppression)
    userId = res.body.user._id;
  });

  // ── TC-006 : Scénario d'erreur — Email déjà utilisé ───────
  // Vérifie que le serveur refuse la création si l'email
  // est déjà enregistré en base (400 Bad Request)
  it('TC-006 : email déjà utilisé → 400', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Doublon',
        prenom: 'Test',
        email: 'supertest@test.com',
        telephone: '0688888888',
        role: 'client',
        motDePasse: 'Test1234'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cet email est déjà utilisé.');
  });

  // ── TC-007 : Scénario nominal — Listing des utilisateurs ───
  // Vérifie que la liste des utilisateurs est retournée
  // sous forme de tableau avec un total supérieur à 0
  it('TC-007 : lister tous les utilisateurs → 200', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  // ── TC-008 : Scénario nominal — Filtrage par rôle admin ────
  // Vérifie que le filtre ?role=admin retourne uniquement
  // des utilisateurs ayant le rôle "admin"
  it('TC-008 : filtrer par rôle admin → tous sont admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ role: 'admin' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.users.forEach(user => {
      expect(user.role).toBe('admin');
    });
  });

  // ── TC-009 : Scénario nominal — Filtrage par rôle client ───
  // Vérifie que le filtre ?role=client retourne uniquement
  // des utilisateurs ayant le rôle "client"
  it('TC-009 : filtrer par rôle client → tous sont client', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ role: 'client' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.users.forEach(user => {
      expect(user.role).toBe('client');
    });
  });

  // ── TC-010 : Scénario nominal — Recherche par email ────────
  // Vérifie que la recherche par email retourne l'utilisateur
  // correspondant avec le bon email
  it('TC-010 : recherche par email → trouve l\'utilisateur', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ email: 'admin@billetterie.com' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].email).toBe('admin@billetterie.com');
  });

  // ── TC-011 : Scénario nominal — Activation d'un compte ─────
  // Vérifie que l'admin peut activer un compte bloqué
  // (génère un mot de passe temporaire et envoie un e-mail)
  it('TC-011 : activer un compte → 200', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/activer`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  // ── TC-012 : Scénario nominal — Blocage d'un compte ────────
  // Vérifie que l'admin peut bloquer un compte actif
  // (le statut passe à "bloqué")
  it('TC-012 : bloquer un compte → 200', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/bloquer`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  // ── TC-013 : Scénario nominal — Suppression d'un compte ────
  // Vérifie que l'admin peut supprimer un compte
  // (suppression logique : le statut passe à "supprimé")
  it('TC-013 : supprimer un compte → 200', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  // ── TC-014 : Scénario d'erreur — Utilisateur inexistant ────
  // Vérifie que le serveur retourne 404 si l'ID fourni
  // ne correspond à aucun utilisateur en base
  it('TC-014 : utilisateur inexistant → 404', async () => {
    const res = await request(app)
      .get('/api/users/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

});

// ═══════════════════════════════════════════════════════════════
// SUITE 3 — STATISTIQUES ET TABLEAU DE BORD
// Teste la route /api/stats
// Scénarios : stats complètes avec token, accès sans token
// ═══════════════════════════════════════════════════════════════
describe('Statistiques', () => {

  // ── TC-015 : Scénario nominal — Statistiques complètes ─────
  // Vérifie que la route retourne toutes les sections attendues
  // (admins, agents, clients, global) avec un total > 0
  it('TC-015 : stats avec token → 200 + toutes les sections', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('admins');
    expect(res.body).toHaveProperty('agents');
    expect(res.body).toHaveProperty('clients');
    expect(res.body).toHaveProperty('global');
    expect(res.body.admins).toHaveProperty('total');
    expect(res.body.global.total).toBeGreaterThan(0);
  });

  // ── TC-016 : Scénario d'erreur — Accès sans token ──────────
  // Vérifie que la route /api/stats est bien protégée
  // et retourne 401 sans token JWT
  it('TC-016 : stats sans token → 401', async () => {
    const res = await request(app)
      .get('/api/stats');

    expect(res.status).toBe(401);
  });

});