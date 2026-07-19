// Mettre l'environnement en mode test pour utiliser la BDD de test
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app, seedDefaultData } = require('../server');
const { sequelize, TypeAbonnement, Abonnement, Voyage } = require('../models');

describe('Tests d\'intégration du Service Abonnements', () => {

  beforeAll(async () => {
    // Synchroniser les modèles avec force: true pour repartir sur une BDD propre
    await sequelize.sync({ force: true });
    // Alimenter les formules d'abonnements par défaut
    await seedDefaultData();
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

  describe('TypeAbonnement CRUD', () => {
    test('devrait récupérer tous les types d\'abonnements', async () => {
      const res = await request(app).get('/api/type-abonnements');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(3);
      expect(res.body[0].nom).toEqual('Ticket simple');
    });

    test('devrait créer un nouveau type d\'abonnement', async () => {
      const res = await request(app)
        .post('/api/type-abonnements')
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
    const testUserId = 'user_test_supertest_123';

    beforeAll(async () => {
      typeAbonnement = await TypeAbonnement.findOne({ where: { nom: 'Ticket simple' } });
    });

    test('devrait attribuer un abonnement à un utilisateur', async () => {
      const res = await request(app)
        .post('/api/abonnements')
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

    test('devrait récupérer les abonnements d\'un utilisateur', async () => {
      const res = await request(app).get(`/api/abonnements/user/${testUserId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(1);
      expect(res.body[0].id).toEqual(createdAbonnementId);
    });

    test('devrait suspendre un abonnement', async () => {
      const res = await request(app).put(`/api/abonnements/${createdAbonnementId}/suspendre`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.abonnement.statut).toEqual('Suspendu');
    });

    test('devrait renouveler et réactiver un abonnement', async () => {
      const res = await request(app).put(`/api/abonnements/${createdAbonnementId}/renouveler`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.abonnement.statut).toEqual('Actif');
      expect(res.body.abonnement.voyages_restants).toEqual(1);
    });
  });

  describe('Validation & Voyage Logic (Critique)', () => {
    let activeAbonnement;
    const userId = 'user_val_test_999';

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

    test('devrait valider avec succès et consommer le ticket simple', async () => {
      const res = await request(app)
        .post('/api/validations/valider')
        .send({ abonnement_id: activeAbonnement.id });

      expect(res.statusCode).toEqual(200);
      expect(res.body.statut_validation).toEqual('VALIDE');
      expect(res.body.details.voyages_restants).toEqual(0);
      expect(res.body.details.voyages_consommes).toEqual(1);
      expect(res.body.details.statut_abonnement).toEqual('Résilie'); // Devrait être résilié car ticket simple avec 0 voyages
    });

    test('devrait refuser la validation d\'un abonnement résilié', async () => {
      const res = await request(app)
        .post('/api/validations/valider')
        .send({ abonnement_id: activeAbonnement.id });

      expect(res.statusCode).toEqual(403);
      expect(res.body.statut_validation).toEqual('REFUSE');
      expect(res.body.raison).toContain('n\'est pas actif');
    });

    test('devrait refuser la validation si l\'abonnement est expiré', async () => {
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
        .post('/api/validations/valider')
        .send({ abonnement_id: expAbonnement.id });

      expect(res.statusCode).toEqual(403);
      expect(res.body.statut_validation).toEqual('REFUSE');
      expect(res.body.raison).toContain('expiré');

      // Vérifier que le statut a bien été mis à jour en base
      const updated = await Abonnement.findByPk(expAbonnement.id);
      expect(updated.statut).toEqual('Résilie');
    });
  });

  describe('GET /api/stats/global', () => {
    test('devrait retourner les indicateurs clés et l\'évolution temporelle', async () => {
      const res = await request(app).get('/api/stats/global');
      expect(res.statusCode).toEqual(200);
      expect(res.body.indicateurs).toBeDefined();
      expect(res.body.repartition_par_statut).toBeDefined();
      expect(res.body.repartition_par_formule).toBeDefined();
    });
  });

});
