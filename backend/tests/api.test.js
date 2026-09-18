// backend/tests/api.test.js
// Importation du module supertest pour effectuer des requêtes HTTP simulées
const request = require('supertest');
// Importation de mongoose pour interagir avec la base de données MongoDB
const mongoose = require('mongoose');
// Importation de bcrypt pour le hachage et la vérification des mots de passe
const bcrypt = require('bcrypt');
// Importation de MongoMemoryServer pour exécuter une instance MongoDB en mémoire pendant les tests
const { MongoMemoryServer } = require('mongodb-memory-server');
// Importation du modèle User pour interagir directement avec la collection des utilisateurs
const User = require('../models/User');

// Mock du module d'envoi d'emails pour éviter d'effectuer de vrais envois SMTP lors des tests
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

// Définition du bloc de tests d'intégration pour l'API
describe('Tests d\'intégration de l\'API - Billetterie Intelligente', () => {
    // Augmentation du délai d'expiration des tests à 30 secondes pour laisser le temps d'initialiser MongoMemoryServer
    jest.setTimeout(30000);
    
    // Déclaration des variables globales au bloc de tests
    let mongod;
    let app;
    let adminToken;
    let createdUserId;
    const adminEmail = 'admin.test@test.sn';
    const adminPassword = 'AdminPassword123!';
    const testUserEmail = 'user.test@test.sn';

    // Hook exécuté une seule fois avant le lancement de l'ensemble des tests du bloc
    beforeAll(async () => {
        // Déconnexion de toute instance Mongoose préexistante
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        let uri = process.env.MONGO_URI;

        if (uri) {
            // Base de test dédiée : évite d'écraser la base de dev pointée par le même
            // MONGO_URI (afterAll fait un dropDatabase()).
            uri = uri.replace(/(\/[^/?]+)(\?|$)/, '$1_test$2');
        } else {
            // Si MONGO_URI n'est pas définie (exécution en local), démarrer MongoMemoryServer
            mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
        }

        // Connexion de Mongoose à la base de données
        await mongoose.connect(uri);

        // Chargement de l'application Express après la connexion à la base
        app = require('../server');

        // Suppression de tous les anciens utilisateurs de test utilisant le domaine @test.sn
        await User.deleteMany({ email: /.*@test\.sn$/ });

        // Génération du mot de passe haché pour l'administrateur
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        // Création de l'utilisateur administrateur dans la base en mémoire
        await User.create({
            nom: 'Admin',
            prenom: 'Test',
            email: adminEmail,
            telephone: '770000000',
            role: 'admin',
            motDePasse: hashedPassword,
            statut: 'actif'
        });

        // Requête d'authentification pour récupérer un jeton JWT valide pour l'administrateur
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminEmail,
                motDePasse: adminPassword
            });

        // Stockage du jeton d'authentification administrateur pour les requêtes suivantes
        adminToken = res.body.token;
    });

    // Hook exécuté une seule fois après la fin de tous les tests
    afterAll(async () => {
        // Nettoyage des données de test et fermeture de la connexion Mongoose
        if (mongoose.connection.readyState !== 0) {
            await User.deleteMany({ email: /.*@test\.sn$/ });
            await mongoose.disconnect();
        }
        // Arrêt du serveur MongoDB en mémoire
        if (mongod) {
            await mongod.stop();
        }
    });

    // Sous-ensemble de tests pour le point d'entrée d'authentification POST /api/auth/login
    describe('POST /api/auth/login', () => {
        // Test de connexion réussie
        test('devrait réussir avec des identifiants valides', async () => {
            // Envoi de la requête de connexion avec des identifiants valides
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminEmail,
                    motDePasse: adminPassword
                });

            // Vérification du code de statut HTTP 200
            expect(res.status).toBe(200);
            // Vérification de la présence du jeton dans la réponse
            expect(res.body).toHaveProperty('token');
            // Vérification de la présence des informations de l'utilisateur
            expect(res.body).toHaveProperty('user');
            // Vérification de la correspondance de l'email
            expect(res.body.user.email).toBe(adminEmail);
            // S'assurer que le mot de passe haché n'est pas renvoyé
            expect(res.body.user).not.toHaveProperty('motDePasse');
        });

        // Test d'échec de connexion pour mot de passe erroné
        test('devrait échouer (401) avec un mot de passe incorrect', async () => {
            // Envoi d'un mauvais mot de passe
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminEmail,
                    motDePasse: 'mauvaisMdp123'
                });

            // Vérification du code d'erreur HTTP 401 Non autorisé
            expect(res.status).toBe(401);
            // Vérification du message d'erreur
            expect(res.body.message).toMatch(/incorrect/i);
            // S'assurer qu'aucun jeton n'est fourni
            expect(res.body).not.toHaveProperty('token');
        });

        // Test de validation des champs requis lors de la connexion
        test('devrait échouer (400) si des champs obligatoires sont manquants', async () => {
            // Envoi d'une requête incomplète sans mot de passe
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminEmail
                });

            // Vérification du code d'erreur HTTP 400 Requête incorrecte
            expect(res.status).toBe(400);
            // Vérification du message indiquant un champ manquant
            expect(res.body.message).toMatch(/requis/i);
        });
    });

    // Sous-ensemble de tests pour la création d'utilisateurs POST /api/users
    describe('POST /api/users (Création d\'un utilisateur par l\'admin)', () => {
        // Test du contrôle d'accès sans jeton JWT
        test('devrait échouer (401) si aucun token n\'est fourni', async () => {
            // Tentative de création sans en-tête d'autorisation
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

            // Vérification de l'interdiction par code 401
            expect(res.status).toBe(401);
        });

        // Test de création réussie d'un utilisateur par un administrateur
        test('devrait réussir (201) et créer l\'utilisateur si l\'admin est connecté', async () => {
            // Envoi de la requête de création avec le jeton administrateur
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

            // Vérification du code HTTP 201 Créé
            expect(res.status).toBe(201);
            // Vérification de la structure de l'utilisateur renvoyé
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUserEmail);
            // Vérification que le statut initial est bloqué
            expect(res.body.user.statut).toBe('bloque');
            // Vérification de l'absence du mot de passe dans la réponse
            expect(res.body.user).not.toHaveProperty('motDePasse');

            // Sauvegarde de l'ID généré pour les tests suivants
            createdUserId = res.body.user.id || res.body.user._id;
        });

        // Test d'unicité de l'adresse email
        test('devrait retourner 400 si l\'email est déjà utilisé', async () => {
            // Tentative de création avec un email déjà existant
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nom: 'Doublon',
                    prenom: 'Test',
                    email: testUserEmail,
                    telephone: '775556677',
                    role: 'agent',
                    motDePasse: 'TempPassword123!'
                });

            // Vérification de l'échec pour doublon avec le code 400
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/déjà utilisé/i);
        });
    });

    // Sous-ensemble de tests pour la récupération et le filtrage des utilisateurs GET /api/users
    describe('GET /api/users (Recherche et filtrage)', () => {
        // Test de récupération de la liste complète des utilisateurs
        test('devrait retourner tous les utilisateurs', async () => {
            // Envoi de la requête de lecture avec le jeton d'accès
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            // Vérification de la réponse HTTP 200
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('users');
            // Vérification qu'au moins 2 utilisateurs existent (l'admin + l'utilisateur créé)
            expect(res.body.total).toBeGreaterThanOrEqual(2);
        });

        // Test du filtrage des utilisateurs par rôle
        test('devrait filtrer par rôle', async () => {
            // Requête filtrée sur le rôle admin
            const res = await request(app)
                .get('/api/users?role=admin')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            // Vérification que tous les éléments retournés ont le rôle 'admin'
            res.body.users.forEach(user => {
                expect(user.role).toBe('admin');
            });
        });

        // Test du filtre de recherche par email
        test('devrait rechercher par email', async () => {
            // Requête filtrée par l'email exact de l'utilisateur de test
            const res = await request(app)
                .get(`/api/users?email=${testUserEmail}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.total).toBe(1);
            expect(res.body.users[0].email).toBe(testUserEmail);
        });
    });

    // Sous-ensemble de tests pour l'activation d'un compte utilisateur PUT /api/users/:id/activer
    describe('PUT /api/users/:id/activer (Activation de l\'utilisateur)', () => {
        // Test de passage de l'état bloqué à actif
        test('devrait activer l\'utilisateur et renvoyer 200', async () => {
            // Envoi de la requête d'activation pour l'utilisateur créé
            const res = await request(app)
                .put(`/api/users/${createdUserId}/activer`)
                .set('Authorization', `Bearer ${adminToken}`);

            // Vérification de la réponse et de la mise à jour du statut dans le corps
            expect(res.status).toBe(200);
            expect(res.body.user.statut).toBe('actif');
            expect(res.body.message).toMatch(/activé/i);

            // Vérification directe en base de données de l'état du document
            const updatedUser = await User.findById(createdUserId);
            expect(updatedUser.statut).toBe('actif');
        });
    });

    // Sous-ensemble de tests pour le placement en corbeille DELETE /api/users/:id
    describe('DELETE /api/users/:id (Corbeille)', () => {
        // Test de suppression logique (déplacement vers la corbeille)
        test('devrait déplacer le compte vers la corbeille et renvoyer 200', async () => {
            // Envoi de la requête de suppression logique
            const res = await request(app)
                .delete(`/api/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.user.statut).toBe('supprime');

            // Vérification en base que le document existe toujours avec le statut 'supprime'
            const trashedUser = await User.findById(createdUserId);
            expect(trashedUser).not.toBeNull();
            expect(trashedUser.statut).toBe('supprime');
            // Vérification de la conservation de l'ancien statut avant suppression
            expect(trashedUser.statutAvantSuppression).toBe('actif');
        });
    });

    // Sous-ensemble de tests pour la restauration d'un compte de la corbeille PUT /api/users/:id/restaurer
    describe('PUT /api/users/:id/restaurer', () => {
        // Test de restauration du statut précédant la suppression
        test('devrait restaurer le compte avec son statut précédent', async () => {
            // Envoi de la demande de restauration
            const res = await request(app)
                .put(`/api/users/${createdUserId}/restaurer`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.user.statut).toBe('actif');

            // Vérification directe en base de données
            const restoredUser = await User.findById(createdUserId);
            expect(restoredUser.statut).toBe('actif');
            expect(restoredUser.statutAvantSuppression).toBeNull();
        });
    });

    // Sous-ensemble de tests pour la suppression définitive DELETE /api/users/:id/definitif
    describe('DELETE /api/users/:id/definitif (Suppression définitive)', () => {
        // Test de suppression physique du document en base
        test('devrait supprimer définitivement le compte', async () => {
            // Envoi de la demande de suppression définitive
            const res = await request(app)
                .delete(`/api/users/${createdUserId}/definitif`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);

            // Vérification que le document n'existe plus en base
            const deletedUser = await User.findById(createdUserId);
            expect(deletedUser).toBeNull();
        });
    });
});