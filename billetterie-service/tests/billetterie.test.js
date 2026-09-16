process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// On mock les clients HTTP vers les services tiers : ce test vérifie la logique PROPRE
// au Service Billetterie (génération/QR/audit/historique), pas la disponibilité réelle
// du Service Utilisateurs ou du Service Abonnements.
jest.mock('../services/abonnementsClient');
jest.mock('../services/usersClient');
const { consommerVoyage } = require('../services/abonnementsClient');
const { obtenirUtilisateur } = require('../services/usersClient');

const { app } = require('../server');
const { sequelize, TitreTransport, Validation, AuditLog } = require('../models');
const { genererQrToken } = require('../utils/qrToken');

describe('Tests d\'intégration du Service Billetterie', () => {
  let adminToken;
  let agentToken;
  const clientId = '507f191e810c19729de860ea';
  const abonnementId = 'b7e6c1a0-1111-4a2b-9c3d-000000000001';

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    adminToken = jwt.sign({ id: 'admin-1', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    agentToken = jwt.sign({ id: 'agent-1', role: 'agent' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    obtenirUtilisateur.mockResolvedValue({ _id: clientId, statut: 'actif', role: 'client' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /health', () => {
    test('devrait retourner le statut du service', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.service).toEqual('billetterie-service');
    });
  });

  describe('Authentification et rôles', () => {
    test('devrait refuser une requête /api sans token', async () => {
      const res = await request(app).get('/api/titres');
      expect(res.statusCode).toEqual(401);
    });

    test('devrait refuser la génération d\'un titre par un agent (admin uniquement)', async () => {
      const res = await request(app)
        .post('/api/titres')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ client_id: clientId, abonnement_id: abonnementId, type_titre: 'Ticket simple' });
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('Génération et consultation des titres', () => {
    let titreId;

    test('devrait générer un titre de transport (admin)', async () => {
      const res = await request(app)
        .post('/api/titres')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client_id: clientId, abonnement_id: abonnementId, type_titre: 'Limité' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.client_id).toEqual(clientId);
      expect(res.body.statut).toEqual('actif');
      titreId = res.body.id;
    });

    test('devrait enregistrer une entrée d\'audit à la génération', async () => {
      const audits = await AuditLog.findAll({ where: { type_action: 'GENERATION_TITRE' } });
      expect(audits.length).toEqual(1);
      expect(audits[0].utilisateur_id).toEqual('admin-1');
    });

    test('devrait refuser un client_id au format invalide', async () => {
      const res = await request(app)
        .post('/api/titres')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ client_id: 'pas-un-objectid', abonnement_id: abonnementId, type_titre: 'Limité' });
      expect(res.statusCode).toEqual(400);
    });

    test('devrait retrouver le titre par son abonnement', async () => {
      const res = await request(app)
        .get(`/api/titres/by-abonnement/${abonnementId}`)
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(titreId);
    });

    test('devrait générer un QR Code exploitable (jeton signé) pour ce titre', async () => {
      const res = await request(app)
        .get(`/api/titres/${titreId}/qrcode`)
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.qrData).toContain('.');
    });

    test('devrait refuser la désactivation par un agent (admin uniquement)', async () => {
      const res = await request(app)
        .put(`/api/titres/${titreId}/desactiver`)
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toEqual(403);
    });

    test('devrait désactiver le titre (admin) et journaliser l\'audit', async () => {
      const res = await request(app)
        .put(`/api/titres/${titreId}/desactiver`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.titre.statut).toEqual('desactive');

      const audits = await AuditLog.findAll({ where: { type_action: 'DESACTIVATION_TITRE' } });
      expect(audits.length).toEqual(1);
    });

    test('devrait réactiver le titre (admin)', async () => {
      const res = await request(app)
        .put(`/api/titres/${titreId}/activer`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.titre.statut).toEqual('actif');
    });
  });

  describe('Scan et validation (POST /api/validations/scanner)', () => {
    let titre;

    beforeAll(async () => {
      titre = await TitreTransport.create({
        client_id: clientId,
        abonnement_id: abonnementId,
        type_titre: 'Limité',
        statut: 'actif',
      });
    });

    test('devrait refuser un QR Code falsifié (signature invalide)', async () => {
      const res = await request(app)
        .post('/api/validations/scanner')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ qrData: 'contenu.invalide' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.statut_validation).toEqual('REFUSE');
    });

    test('devrait refuser un QR Code dont le titre n\'existe pas', async () => {
      const qrData = genererQrToken('00000000-0000-0000-0000-000000000000');
      const res = await request(app)
        .post('/api/validations/scanner')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ qrData });

      expect(res.statusCode).toEqual(404);
      expect(res.body.statut_validation).toEqual('REFUSE');
    });

    test('devrait autoriser le voyage quand le Service Abonnements l\'accepte', async () => {
      consommerVoyage.mockResolvedValueOnce({
        autorise: true,
        abonnement: { id: abonnementId, voyages_restants: 4, voyages_consommes: 1 },
      });

      const qrData = genererQrToken(titre.id);
      const res = await request(app)
        .post('/api/validations/scanner')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ qrData });

      expect(res.statusCode).toEqual(200);
      expect(res.body.statut_validation).toEqual('VALIDE');

      const validation = await Validation.findOne({ where: { titre_id: titre.id, resultat: 'autorise' } });
      expect(validation).not.toBeNull();
      expect(validation.agent_id).toEqual('agent-1');
    });

    test('devrait refuser le voyage quand le Service Abonnements le refuse (ex. solde épuisé)', async () => {
      consommerVoyage.mockResolvedValueOnce({ autorise: false, raison: 'Solde de voyages épuisé.' });

      const qrData = genererQrToken(titre.id);
      const res = await request(app)
        .post('/api/validations/scanner')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ qrData });

      expect(res.statusCode).toEqual(403);
      expect(res.body.statut_validation).toEqual('REFUSE');
      expect(res.body.raison).toContain('épuisé');

      const refus = await Validation.findOne({ where: { titre_id: titre.id, resultat: 'refuse' } });
      expect(refus).not.toBeNull();
      expect(refus.motif_refus).toContain('épuisé');
    });

    test('devrait refuser un titre désactivé sans même appeler le Service Abonnements', async () => {
      await titre.update({ statut: 'desactive' });
      consommerVoyage.mockClear();

      const qrData = genererQrToken(titre.id);
      const res = await request(app)
        .post('/api/validations/scanner')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ qrData });

      expect(res.statusCode).toEqual(403);
      expect(res.body.raison).toContain('désactivé');
      expect(consommerVoyage).not.toHaveBeenCalled();
    });

    test('devrait désactiver automatiquement un ticket simple après son unique voyage', async () => {
      const ticketSimple = await TitreTransport.create({
        client_id: clientId,
        abonnement_id: 'b7e6c1a0-1111-4a2b-9c3d-000000000099',
        type_titre: 'Ticket simple',
        statut: 'actif',
      });
      consommerVoyage.mockResolvedValueOnce({
        autorise: true,
        abonnement: { voyages_restants: 0, voyages_consommes: 1 },
      });

      const qrData = genererQrToken(ticketSimple.id);
      const res = await request(app)
        .post('/api/validations/scanner')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ qrData });

      expect(res.statusCode).toEqual(200);

      await ticketSimple.reload();
      expect(ticketSimple.statut).toEqual('desactive');
    });

    test('devrait refuser un scan par un rôle client', async () => {
      const clientToken = jwt.sign({ id: clientId, role: 'client' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const res = await request(app)
        .post('/api/validations/scanner')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ titre_id: titre.id });
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /api/audit', () => {
    test('devrait être réservé aux administrateurs', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toEqual(403);
    });

    test('devrait lister les entrées d\'audit pour un administrateur', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.audits.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/stats', () => {
    test('devrait retourner les indicateurs du tableau de bord', async () => {
      const res = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.indicateurs).toBeDefined();
      expect(res.body.indicateurs.total_validations).toBeGreaterThan(0);
    });
  });
});
