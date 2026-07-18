const request = require('supertest');
const { app, connectDB } = require('../server');
const mongoose = require('mongoose');

let token;
let userId;

beforeAll(async () => {
  await connectDB();

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@billetterie.com', motDePasse: 'Admin1234' });

  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Authentification', () => {

  it('TC-001 : login réussi → 200 + token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@billetterie.com', motDePasse: 'Admin1234' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user).not.toHaveProperty('motDePasse');
  });

  it('TC-002 : mauvais mot de passe → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@billetterie.com', motDePasse: 'mauvais' });

    expect(res.status).toBe(401);
  });

  it('TC-003 : email manquant → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ motDePasse: 'Admin1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email et mot de passe requis.');
  });

  it('TC-004 : accès route protégée sans token → 401', async () => {
    const res = await request(app)
      .get('/api/users');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Accès refusé. Aucun token fourni.');
  });

});

describe('Gestion des utilisateurs', () => {

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

    userId = res.body.user._id;
  });

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

  it('TC-007 : lister tous les utilisateurs → 200', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

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

  it('TC-009 : recherche par email → trouve l\'utilisateur', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ email: 'admin@billetterie.com' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].email).toBe('admin@billetterie.com');
  });

  it('TC-010 : utilisateur inexistant → 404', async () => {
    const res = await request(app)
      .get('/api/users/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('TC-011 : activer un compte → 200', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/activer`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('TC-012 : bloquer un compte → 200', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/bloquer`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('TC-013 : supprimer un compte → 200', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

});

describe('Statistiques', () => {

  it('TC-014 : stats avec token → 200 + toutes les sections', async () => {
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

  it('TC-015 : stats sans token → 401', async () => {
    const res = await request(app)
      .get('/api/stats');

    expect(res.status).toBe(401);
  });

});