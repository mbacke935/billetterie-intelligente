# Billetterie intelligente

Application de billetterie avec QR Code et gestion d'abonnements, organisée en microservices.

## Structure du dépôt

```
billetterie-intelligente/
├── backend/               # Service Utilisateurs (auth, users, stats) — Express + MongoDB
├── abonnements-service/   # Service Abonnements — Express + MySQL (Sequelize)
├── billetterie-service/   # Service Billetterie — génération/validation QR Code — Express + PostgreSQL (Sequelize)
├── frontend/              # Application React (Vite)
└── .github/workflows/     # Pipeline d'intégration continue (GitHub Actions)
```

Les trois services backend vérifient le même JWT (signé par le Service Utilisateurs) sans jamais accéder aux bases de données des autres.

## Installation

Chaque application possède ses propres dépendances et son propre fichier d'environnement.

```bash
# Pour chaque dossier (backend, abonnements-service, billetterie-service, frontend) :
cd <dossier>
cp .env.example .env   # puis renseigner les valeurs
npm install
```

## Démarrage en développement

```bash
cd backend && npm run dev              # http://localhost:5000
cd abonnements-service && npm run dev  # http://localhost:5001
cd billetterie-service && npm run dev  # http://localhost:5002
cd frontend && npm run dev             # http://localhost:5173
```

## Tests

Chaque service backend a sa propre suite de tests Jest :

```bash
cd backend && npm test
cd abonnements-service && npm test
cd billetterie-service && npm test
```

- `backend` a besoin d'une base MongoDB accessible (voir `MONGO_URI` dans `.env`).
- `abonnements-service` a besoin d'une base MySQL nommée `<DB_NAME>_test` en environnement de test.
- `billetterie-service` a besoin d'une base PostgreSQL nommée `<DB_NAME>_test` en environnement de test.

## Intégration continue

Le pipeline `.github/workflows/ci.yml` s'exécute à chaque `push`/`pull_request` sur `main` et `develop` :

| Job | Rôle |
|---|---|
| `test-backend` | Installe et teste le Service Utilisateurs (connexion à `secrets.MONGO_URI_TEST`) |
| `test-abonnements-service` | Teste le Service Abonnements avec un conteneur MySQL éphémère |
| `test-billetterie-service` | Teste le Service Billetterie avec un conteneur PostgreSQL éphémère |
| `build-frontend` | Vérifie que le frontend compile (`npm run build`) |

### Secrets GitHub requis

À configurer dans *Settings > Secrets and variables > Actions* :

| Secret | Utilité |
|---|---|
| `MONGO_URI_TEST` | Connexion à la base MongoDB de test utilisée par `backend` |
| `JWT_SECRET` | Secret partagé de signature/vérification des JWT entre les 3 services |
| `EMAIL_USER` / `EMAIL_PASS` | Identifiants email (l'envoi est mocké dans les tests, non strictement requis) |
| `VITE_API_URL` | Réservé pour une future configuration par environnement du frontend (non consommé par le code actuel) |
| `QR_SECRET` (optionnel) | Clé HMAC de signature des QR Codes pour `billetterie-service` (a une valeur par défaut de secours) |

⚠️ La base pointée par `MONGO_URI_TEST` doit être accessible depuis les runners GitHub Actions (vérifier le Network Access de MongoDB Atlas si `ETIMEOUT`/`querySrv` apparaît dans les logs).

## Variables d'environnement

Voir `.env.example` dans chaque dossier de service. **Ne jamais committer de fichier `.env`** (déjà exclu par `.gitignore`).
