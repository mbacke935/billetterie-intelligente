# Guide d'Exécution et d'Écriture des Tests

Ce répertoire contient la suite de tests unitaires et d'intégration pour le backend du projet **Billetterie Intelligente**.

---

## 1. Structure des Tests

La suite est composée de deux fichiers principaux :

1.  **`generatePassword.test.js`** : Test unitaire ciblant la fonction utilitaire `generatePassword.js`.
2.  **`api.test.js`** : Tests d'intégration API avec **Supertest** ciblant les routes d'authentification (`/api/auth`) et de gestion des utilisateurs (`/api/users`).

---

## 2. Prérequis

Avant de lancer les tests, assurez-vous d'avoir installé toutes les dépendances de développement dans le dossier `backend` :

```bash
cd backend
npm install
```

Les dépendances clés installées sont :
-   `jest` : Framework d'exécution des tests et bibliothèque d'assertions.
-   `supertest` : Client HTTP en mémoire permettant de requêter notre application Express sans ouvrir de port physique.

---

## 3. Lancement des Tests

Pour exécuter la suite complète de tests, lancez la commande suivante depuis le dossier `backend` :

```bash
npm test
```

### Options de la commande configurées dans `package.json` :
-   `--runInBand` : Exécute les tests séquentiellement (l'un après l'autre) pour éviter les conflits d'écriture/lecture simultanées dans la base de données de test.
-   `--detectOpenHandles` : Aide à détecter si des sockets réseaux (comme la connexion MongoDB) ou des timers restent actifs à la fin des tests.
-   `--forceExit` : Force Jest à quitter une fois tous les tests terminés, même si certaines connexions asynchrones restent actives en arrière-plan.

---

## 4. Guide de Lecture des Tests

### A. Le Test Unitaire (`tests/generatePassword.test.js`)
Ce test ne fait appel à aucun composant externe (pas de base de données, pas d'API). Il vérifie la logique algorithmique pure.
*   **Vérification 1** : La fonction génère bien une chaîne de 8 caractères par défaut.
*   **Vérification 2** : Elle respecte les longueurs demandées (ex: 12, 16).
*   **Vérification 3** : Les caractères générés appartiennent uniquement au jeu de caractères autorisés.
*   **Vérification 4** : Deux appels successifs retournent des mots de passe différents (caractère aléatoire).

### B. Les Tests d'Intégration API (`tests/api.test.js`)
Ces tests effectuent de véritables requêtes HTTP simulées et interagissent avec la base de données de test MongoDB.

1.  **Isolation des emails** :
    Tous les utilisateurs créés lors des tests possèdent une adresse e-mail se terminant par `@test.sn` (ex: `admin.test@test.sn`).
2.  **Nettoyage automatique (Sandbox BDD)** :
    *   `beforeAll` : Supprime tous les utilisateurs de test existants en base et insère un compte administrateur propre.
    *   `afterAll` : Supprime tous les utilisateurs créés pendant les tests et ferme proprement la connexion MongoDB avec `mongoose.connection.close()`.
3.  **Mocking de l'envoi d'e-mails** :
    L'appel à `nodemailer` pour l'activation des comptes est intercepté par Jest :
    ```javascript
    jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));
    ```
    Cela évite d'envoyer des e-mails réels et garantit que les tests n'échouent pas à cause d'une limite réseau ou d'identifiants SMTP invalides.

---

## 5. Comment ajouter un nouveau test ?

Pour tester une nouvelle route (ex: `/api/tickets`) :
1.  Créez un fichier de test `tests/tickets.test.js`.
2.  Importez `supertest` et votre fichier `server.js` :
    ```javascript
    const request = require('supertest');
    const app = require('../server');
    ```
3.  Utilisez la structure Jest standard :
    ```javascript
    describe('GET /api/tickets', () => {
        test('devrait retourner la liste des tickets', async () => {
            const res = await request(app)
                .get('/api/tickets')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
    ```
