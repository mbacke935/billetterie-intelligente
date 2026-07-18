const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../server');
const User = require('../models/User');

// Mocker l'envoi d'emails pour éviter d'envoyer des courriels réels et bloquer les tests
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

describe('Tests d\'intégration de l\'API - Billetterie Intelligente', () => {
    jest.setTimeout(30000); // 30 secondes pour les opérations lentes (Atlas)
    let adminToken;
    let createdUserId;
    const adminEmail = 'admin.test@test.sn';
    const adminPassword = 'AdminPassword123!';
    const testUserEmail = 'user.test@test.sn';

    beforeAll(async () => {
        // Nettoyer les anciens utilisateurs de test de la base de données
        await User.deleteMany({ email: /.*@test\.sn$/ });

        // Créer un compte administrateur de test actif
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({
            nom: 'Admin',
            prenom: 'Test',
            email: adminEmail,
            telephone: '770000000',
            role: 'admin',
            motDePasse: hashedPassword,
            statut: 'actif'
        });

        // Se connecter pour obtenir le token JWT
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminEmail,
                motDePasse: adminPassword
            });

        adminToken = res.body.token;
    });

    afterAll(async () => {
        // Nettoyer tous les comptes de test créés
        await User.deleteMany({ email: /.*@test\.sn$/ });
        // Fermer la connexion MongoDB pour permettre à Jest de se terminer
        await mongoose.connection.close();
    });

    describe('POST /api/auth/login', () => {
        test('devrait réussir avec des identifiants valides', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminEmail,
                    motDePasse: adminPassword
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(adminEmail);
            expect(res.body.user).not.toHaveProperty('motDePasse');
        });

        test('devrait échouer (401) avec un mot de passe incorrect', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminEmail,
                    motDePasse: 'mauvaisMdp123'
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/incorrect/i);
            expect(res.body).not.toHaveProperty('token');
        });

        test('devrait échouer (400) si des champs obligatoires sont manquants', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminEmail
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/requis/i);
        });
    });

    describe('POST /api/users (Création d\'un utilisateur par l\'admin)', () => {
        test('devrait échouer (401) si aucun token n\'est fourni', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({
                    nom: 'Utilisateur',
                    prenom: 'Test',
                    email: testUserEmail,
                    telephone: '771112233',
                    role: 'agent',
                    motDePasse: 'TempPassword123!'
                });

            expect(res.status).toBe(401);
        });

        test('devrait réussir (201) et créer l\'utilisateur si l\'admin est connecté', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nom: 'Utilisateur',
                    prenom: 'Test',
                    email: testUserEmail,
                    telephone: '771112233',
                    role: 'agent',
                    motDePasse: 'TempPassword123!'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUserEmail);
            expect(res.body.user.statut).toBe('bloque'); // bloqué par défaut
            expect(res.body.user).not.toHaveProperty('motDePasse');

            createdUserId = res.body.user.id || res.body.user._id;
        });

        test('devrait retourner 400 si l\'email est déjà utilisé', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nom: 'Doublon',
                    prenom: 'Test',
                    email: testUserEmail, // même email
                    telephone: '775556677',
                    role: 'agent',
                    motDePasse: 'TempPassword123!'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/déjà utilisé/i);
        });
    });

    describe('GET /api/users (Recherche et filtrage)', () => {
        test('devrait retourner tous les utilisateurs', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('users');
            expect(res.body.total).toBeGreaterThanOrEqual(2); // admin + utilisateur créé
        });

        test('devrait filtrer par rôle', async () => {
            const res = await request(app)
                .get('/api/users?role=admin')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            res.body.users.forEach(user => {
                expect(user.role).toBe('admin');
            });
        });

        test('devrait rechercher par email', async () => {
            const res = await request(app)
                .get(`/api/users?email=${testUserEmail}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.total).toBe(1);
            expect(res.body.users[0].email).toBe(testUserEmail);
        });
    });

    describe('PUT /api/users/:id/activer (Activation de l\'utilisateur)', () => {
        test('devrait activer l\'utilisateur et renvoyer 200', async () => {
            const res = await request(app)
                .put(`/api/users/${createdUserId}/activer`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.user.statut).toBe('actif');
            expect(res.body.message).toMatch(/activé/i);

            // Vérifier que l'utilisateur est maintenant bien 'actif' en BDD
            const updatedUser = await User.findById(createdUserId);
            expect(updatedUser.statut).toBe('actif');
        });
    });

    describe('DELETE /api/users/:id (Suppression logique)', () => {
        test('devrait effectuer une suppression logique et renvoyer 200', async () => {
            const res = await request(app)
                .delete(`/api/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.user.statut).toBe('supprime');

            // Vérifier en BDD
            const deletedUser = await User.findById(createdUserId);
            expect(deletedUser.statut).toBe('supprime');
        });
    });
});
