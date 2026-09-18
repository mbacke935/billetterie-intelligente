// Mettre l'environnement en mode test pour utiliser la BDD de test
process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, seedDefaultData } = require('../server');
const { sequelize, TypeAbonnement, Abonnement } = require('../models');

describe('Tests d\'intégration du Service Abonnements', () => {
  // Toutes les routes /api exigent désormais un JWT du Service Utilisateurs
  let token;

  beforeAll(async () => {
    // Synchroniser les modèles avec force: true pour repartir sur une BDD propre
    await sequelize.sync({ force: true });
    // Alimenter les formules d'abonnements par défaut
    await seedDefaultData();

    token = jwt.sign({ id: '507f191e810c19729de860ea', role: 'agent' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Fermer la connexion à la base de données
    await sequelize.close();
  });

  describe('GET /health', () => {
    test('devrait retourner le statut du service', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('UP');
      expect(res.body.service).toEqual('abonnements-service');
    });
  });

  describe('Authentification', () => {
    test('devrait refuser une requête /api sans token', async () => {
      const res = await request(app).get('/api/type-abonnements');
      expect(res.statusCode).toEqual(401);
    });

    test('devrait refuser un token invalide', async () => {
      const res = await request(app)
        .get('/api/type-abonnements')
        .set('Authorization', 'Bearer token-invalide');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('TypeAbonnement CRUD', () => {
    test('devrait récupérer tous les types d\'abonnements', async () => {
      const res = await request(app)
        .get('/api/type-abonnements')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(3);
      expect(res.body[0].nom).toEqual('Ticket simple');
    });

    test('devrait créer un nouveau type d\'abonnement', async () => {
      const res = await request(app)
        .post('/api/type-abonnements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nom: 'Limité', // Autorisé par validation isIn
          tarif: 25.00,
          duree_validite: 15,
          voyages_initiaux: 20
        });
      expect(res.statusCode).toEqual(201);
      expect(Number(res.body.tarif)).toEqual(25);
    });
  });

  describe('Abonnement Logic', () => {
    let typeAbonnement;
    let createdAbonnementId;
    // Attribution, suspension et renouvellement sont réservés aux administrateurs
    // (cf. routes/abonnementRoutes.js) : un token 'agent' y serait refusé avec 403.
    let adminToken;
    const testUserId = '507f191e810c19729de860ea'; // format ObjectId Mongo (24 hex) attendu du Service Utilisateurs

    beforeAll(async () => {
      typeAbonnement = await TypeAbonnement.findOne({ where: { nom: 'Ticket simple' } });
      adminToken = jwt.sign({ id: 'admin-1', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    test('devrait attribuer un abonnement à un utilisateur', async () => {
      const res = await request(app)
        .post('/api/abonnements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_id: testUserId,
          type_abonnement_id: typeAbonnement.id
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.user_id).toEqual(testUserId);
      expect(res.body.voyages_restants).toEqual(1);
      expect(res.body.statut).toEqual('Actif');
      createdAbonnementId = res.body.id;
    });

    test('devrait refuser un user_id au format invalide', async () => {
      const res = await request(app)
        .post('/api/abonnements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_id: 'pas-un-objectid-valide',
          type_abonnement_id: typeAbonnement.id
        });

      expect(res.statusCode).toEqual(400);
    });

    test('devrait récupérer les abonnements d\'un utilisateur', async () => {
      const res = await request(app)
        .get(`/api/abonnements/user/${testUserId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(1);
      expect(res.body[0].id).toEqual(createdAbonnementId);
    });

    test('devrait suspendre un abonnement', async () => {
      const res = await request(app)
        .put(`/api/abonnements/${createdAbonnementId}/suspendre`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.abonnement.statut).toEqual('Suspendu');
    });

    test('devrait renouveler et réactiver un abonnement', async () => {
      const res = await request(app)
        .put(`/api/abonnements/${createdAbonnementId}/renouveler`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.abonnement.statut).toEqual('Actif');
      expect(res.body.abonnement.voyages_restants).toEqual(1);
    });
  });

  describe('POST /api/abonnements/:id/consommer-voyage (Critique - appelé par le Service Billetterie)', () => {
    let activeAbonnement;
    const userId = '507f191e810c19729de860eb';

    beforeAll(async () => {
      const type = await TypeAbonnement.findOne({ where: { nom: 'Ticket simple' } });
      activeAbonnement = await Abonnement.create({
        user_id: userId,
        type_abonnement_id: type.id,
        date_debut: new Date(),
        date_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expiration dans 1 jour
        voyages_restants: 1,
        voyages_consommes: 0,
        statut: 'Actif'
      });
    });

    test('devrait consommer avec succès le voyage d\'un ticket simple', async () => {
      const res = await request(app)
        .post(`/api/abonnements/${activeAbonnement.id}/consommer-voyage`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.abonnement.voyages_restants).toEqual(0);
      expect(res.body.abonnement.voyages_consommes).toEqual(1);
      expect(res.body.abonnement.statut).toEqual('Résilie'); // Devrait être résilié car ticket simple avec 0 voyages
    });

    test('devrait refuser la consommation d\'un abonnement résilié', async () => {
      const res = await request(app)
        .post(`/api/abonnements/${activeAbonnement.id}/consommer-voyage`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain('n\'est pas actif');
    });

    test('devrait refuser la consommation si l\'abonnement est expiré', async () => {
      const type = await TypeAbonnement.findOne({ where: { nom: 'Illimité' } });
      const expAbonnement = await Abonnement.create({
        user_id: userId,
        type_abonnement_id: type.id,
        date_debut: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        date_expiration: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expiré depuis 1 jour
        voyages_restants: -1,
        voyages_consommes: 0,
        statut: 'Actif'
      });

      const res = await request(app)
        .post(`/api/abonnements/${expAbonnement.id}/consommer-voyage`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain('expiré');

      // Vérifier que le statut a bien été mis à jour en base
      const updated = await Abonnement.findByPk(expAbonnement.id);
      expect(updated.statut).toEqual('Résilie');
    });

    test('ne devrait jamais laisser deux consommations simultanées vider le même dernier voyage', async () => {
      const type = await TypeAbonnement.findOne({ where: { nom: 'Limité' } });
      const dernierVoyage = await Abonnement.create({
        user_id: userId,
        type_abonnement_id: type.id,
        date_debut: new Date(),
        date_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000),
        voyages_restants: 1,
        voyages_consommes: 0,
        statut: 'Actif'
      });

      // Deux scans concurrents du même dernier voyage restant.
      const [res1, res2] = await Promise.all([
        request(app).post(`/api/abonnements/${dernierVoyage.id}/consommer-voyage`).set('Authorization', `Bearer ${token}`),
        request(app).post(`/api/abonnements/${dernierVoyage.id}/consommer-voyage`).set('Authorization', `Bearer ${token}`),
      ]);

      const statuts = [res1.statusCode, res2.statusCode].sort();
      expect(statuts).toEqual([200, 403]); // Un seul des deux doit réussir

      const updated = await Abonnement.findByPk(dernierVoyage.id);
      expect(updated.voyages_restants).toEqual(0);
      expect(updated.voyages_consommes).toEqual(1); // Jamais 2
    });
  });

  describe('GET /api/stats/global', () => {
    test('devrait retourner les indicateurs clés et l\'évolution temporelle', async () => {
      const res = await request(app)
        .get('/api/stats/global')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.indicateurs).toBeDefined();
      expect(res.body.repartition_par_statut).toBeDefined();
      expect(res.body.repartition_par_formule).toBeDefined();
    });
  });

});
