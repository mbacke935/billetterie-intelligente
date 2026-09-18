# Rapport de diagnostic — TP 1 : CI/CD avec GitHub Actions

Ce rapport trace les commandes exécutées et leurs résultats lors de la mise en place du pipeline CI, ainsi que les bugs réels découverts et corrigés dans chaque service en le testant localement avant de l'intégrer au workflow GitHub Actions.

Environnement local utilisé pour les tests (bases de données éphémères, en plus de MongoDB Atlas pour `backend`) :
- MySQL 8 via Docker (`abonnements-service`)
- PostgreSQL 16 via Docker (`billetterie-service`)
- MongoDB 7 via Docker (`backend`, en secours car l'accès réseau sortant vers Atlas était bloqué dans l'environnement d'exécution local)

---

## 1. `backend` — Service Utilisateurs

### 1.1 Bug : `connectDB` non exporté par `server.js`

**Commande :**
```bash
cd backend
NODE_ENV=test npm test
```

**Résultat (avant correction) :**
```
Erreur de connexion : querySrv ETIMEOUT _mongodb._tcp.cluster0.kpgikt5.mongodb.net
● Test suite failed to run
  MongooseError: Operation `users.deleteMany()` buffering timed out after 10000ms
```

**Cause :** `tests/users.test.js` importait `const { app, connectDB } = require('../server')`, alors que `server.js` exporte uniquement `module.exports = app` (l'export n'est pas un objet `{app, connectDB}`). `connectDB` valait donc `undefined` et `await connectDB()` échouait silencieusement / provoquait un blocage. Par ailleurs, `tests/api.test.js` n'établissait aucune connexion à MongoDB lui-même : il ne fonctionnait que si un autre fichier de test avait déjà ouvert la connexion avant lui, ce qui n'est pas garanti (chaque fichier Jest a son propre registre de modules).

**Correction :**
- `tests/users.test.js` : `const app = require('../server'); const connectDB = require('../config/db');`
- `tests/api.test.js` : ajout de `const connectDB = require('../config/db');` et de `await connectDB();` en première ligne du `beforeAll`.

### 1.2 Bug : envoi d'un e-mail réel pendant les tests

**Résultat (avant correction) :**
```
FAIL tests/users.test.js
● TC-004 : admin peut créer un utilisateur → 201
  thrown: "Exceeded timeout of 30000 ms for a test."
```

**Cause :** la création d'utilisateur déclenche `sendEmail(...)` (envoi réel via Nodemailer/Gmail). `tests/api.test.js` mockait déjà cet appel (`jest.mock('../utils/sendEmail', ...)`) mais `tests/users.test.js` non, ce qui rendait le test lent, dépendant du réseau, et instable en CI.

**Correction :** ajout de `jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));` dans `tests/users.test.js`, comme dans `api.test.js`.

### 1.3 Bug : assertion obsolète sur le message de réponse

**Résultat (avant correction) :**
```
Expected: "Utilisateur créé avec succès."
Received: "Utilisateur créé avec succès. Le compte doit être activé par un administrateur."
```

**Cause :** le contrôleur (`userController.js`) a été mis à jour (nouveaux comptes bloqués par défaut) mais le test n'avait pas été aligné.

**Correction :** mise à jour de l'assertion pour refléter le message réel du contrôleur.

**Commande et résultat final (après les 3 corrections), avec une base MongoDB locale de secours :**
```bash
cd backend
NODE_ENV=test MONGO_URI="mongodb://127.0.0.1:27018/billetterie_test" JWT_SECRET=test_secret npm test
```
```
Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
Time:        11.089 s
```

---

## 2. `abonnements-service` — Service Abonnements

### Bug : rôle JWT insuffisant pour des actions réservées aux administrateurs

**Commande :**
```bash
cd abonnements-service
NODE_ENV=test DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=root DB_PASSWORD=root \
DB_NAME=billetterie_abonnements_test JWT_SECRET=test_secret npm test
```

**Résultat (avant correction) :**
```
Tests d'intégration du Service Abonnements › Abonnement Logic
  ✕ devrait attribuer un abonnement à un utilisateur   (Expected 201, Received 403)
  ✕ devrait refuser un user_id au format invalide      (Expected 400, Received 403)
  ✕ devrait récupérer les abonnements d'un utilisateur (Expected 1, Received 0)
  ✕ devrait suspendre un abonnement                    (Expected 200, Received 403)
  ✕ devrait renouveler et réactiver un abonnement      (Expected 200, Received 403)

Test Suites: 1 failed, 1 total
Tests:       5 failed, 10 passed, 15 total
```

**Cause :** le token JWT utilisé dans le bloc `Abonnement Logic` portait le rôle `agent`. Or `routes/abonnementRoutes.js` réserve explicitement la création (`POST /`) aux rôles `admin`/`client`, et la suspension/le renouvellement (`PUT /:id/suspendre`, `PUT /:id/renouveler`) au rôle `admin` uniquement. Le token `agent` était donc à juste titre rejeté (403), ce qui faisait ensuite échouer en cascade le test de consultation (l'abonnement n'avait jamais été créé).

**Correction :** génération d'un `adminToken` (rôle `admin`) dédié à ce bloc de tests, utilisé pour la création, la suspension et le renouvellement — conforme à la politique d'autorisation réelle du service. Le token `agent` reste utilisé ailleurs (ex. `consommer-voyage`), là où il est effectivement autorisé.

**Résultat (après correction) :**
```
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Time:        15.959 s
```

---

## 3. `billetterie-service` — Service Billetterie

Aucun bug de code : la suite de tests était déjà correcte (mocks des services externes en place).

**Commande et résultat :**
```bash
cd billetterie-service
NODE_ENV=test DB_HOST=127.0.0.1 DB_PORT=5433 DB_USER=postgres DB_PASSWORD=postgres \
DB_NAME=billetterie_titres_test JWT_SECRET=test_secret QR_SECRET=test_qr_secret npm test
```
```
Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Time:        15.739 s
```

*(Le premier essai avait échoué avec `SequelizeConnectionError: database "billetterie_titres_test" does not exist` — erreur d'environnement de test local (base non créée), pas un bug applicatif ; corrigé en créant la base avant de relancer.)*

---

## 4. `frontend`

**Commande et résultat :**
```bash
cd frontend
npm run build
```
```
✓ 1910 modules transformed.
✓ built in 1m 45s
```
Aucune variable d'environnement n'est requise : les URLs des services sont codées en dur dans `src/services/*.js` (voir `frontend/.env.example`).

---

## 5. Problèmes d'hygiène du dépôt corrigés (Étape 1 du TP)

| Constat | Risque | Correction |
|---|---|---|
| `backend/.env` et `frontend/.env` étaient suivis par git depuis le premier commit et déjà poussés sur GitHub (`backend/.env` contient un mot de passe MongoDB Atlas et un mot de passe d'application Gmail réels) | Fuite d'identifiants réels sur un dépôt distant | `git rm --cached backend/.env frontend/.env` ; création de `.env.example` dans chaque service. **Ces identifiants restent visibles dans l'historique git : ils doivent être changés côté MongoDB Atlas et Gmail.** |
| `.gitignore` ne contenait ni `dist/`, ni `build/`, ni `billetterie-service/logs/` | Fichiers de build générés et logs applicatifs versionnés (bruit, conflits inutiles) | Ajout de ces règles à `.gitignore` ; `git rm -r --cached frontend/dist billetterie-service/logs` |
| Pas de `README.md` à la racine | Non-conformité à l'étape 1 du TP | `README.md` créé (structure, installation, tests, secrets CI) |
| Pas de `.env.example` pour aucun service | Non-conformité à l'étape 1 du TP | `.env.example` créé pour `backend`, `frontend`, `abonnements-service`, `billetterie-service` |

---

## 6. Limite rencontrée dans cette session

L'environnement d'exécution local utilisé pour ce diagnostic n'a **aucun accès réseau sortant** (DNS et ping bloqués), ce qui empêchait `backend` de joindre MongoDB Atlas (`querySrv ETIMEOUT`). Un conteneur MongoDB local (puis un `mongod.exe` local) a donc été utilisé pour valider les correctifs de test.

## 7. Fusion avec un travail parallèle sur `origin/main`

Au moment de pousser, `origin/main` avait avancé de 9 commits indépendants (probablement une autre session travaillant sur le même TP) qui avaient déjà :
- retiré `backend/.env` du suivi et ajouté un `.gitignore`/`backend/.env.example` (mais **`backend/.env.example` contenait les vraies valeurs secrètes** — mot de passe MongoDB Atlas et JWT_SECRET réels — recopiées telles quelles au lieu de champs vides : corrigé lors de la fusion) ;
- corrigé les mêmes bugs de `backend/tests/*.test.js` avec une approche différente et plus robuste : `mongodb-memory-server` (chaque suite démarre son propre MongoDB en mémoire, sans dépendre d'Atlas ni d'un secret `MONGO_URI_TEST`) ;
- mis en place un premier `ci.yml` ne couvrant que `backend`.

**Résolution :** fusion (`git merge origin/main`) en conservant le meilleur des deux versions : l'approche `mongodb-memory-server` pour `backend` (plus robuste, aucun secret Mongo requis), les jobs `test-abonnements-service`/`test-billetterie-service`/`build-frontend` ajoutés dans cette session, et un `.gitignore`/`.env.example` nettoyés (valeurs vides, pas de secrets en clair). Voir le commit de merge pour le détail des conflits résolus.

Grâce à `mongodb-memory-server`, le job `test-backend` n'a plus besoin du secret `MONGO_URI_TEST` ni d'un accès réseau vers Atlas depuis les runners GitHub Actions — un point qui aurait autrement nécessité de vérifier le Network Access de MongoDB Atlas (`0.0.0.0/0`).

---

## 8. Étape 6 du TP — Pipeline échoué puis corrigé (preuve GitHub Actions)

L'exercice demandé (casser volontairement une assertion, pousser, observer l'échec, corriger, repousser, obtenir un pipeline vert) a été réalisé directement sur GitHub :

**Run #18 « test1 » — commit [`4ab0d2d`](https://github.com/mbacke935/billetterie-intelligente/commit/4ab0d2d) — ❌ Échec**
```diff
- expect(password).toHaveLength(8);
+ expect(password).toHaveLength(99);
```
Log du job `Tests - Service Utilisateurs (backend)` :
```
FAIL tests/generatePassword.test.js
✕ devrait générer un mot de passe de 8 caractères par défaut (3 ms)

  expect(received).toHaveLength(expected)
  Expected length: 99
  Received length: 8
  Received string: "HsFzvzqk"

Tests: 1 failed, 21 passed, 22 total
Error: Process completed with exit code 1.
```
Diagnostic : `generatePassword()` génère par défaut un mot de passe de 8 caractères (comportement correct, voir `backend/utils/generatePassword.js`) ; c'est l'assertion du test qui a été modifiée par erreur (99 au lieu de 8).

**Run #19 « test2 » — commit [`7ea1c7b`](https://github.com/mbacke935/billetterie-intelligente/commit/7ea1c7b) — ✅ Succès**
```diff
- expect(password).toHaveLength(99);
+ expect(password).toHaveLength(8);
```
Assertion restaurée à sa valeur correcte → les 4 jobs passent, pipeline vert.

Voir l'onglet [Actions](https://github.com/mbacke935/billetterie-intelligente/actions) du dépôt pour les captures d'écran de ces deux runs (livrables « Capture d'un pipeline échoué » / « Capture d'un pipeline réussi »).
