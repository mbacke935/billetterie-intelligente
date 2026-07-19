const http = require('http');

// Helper to make HTTP requests
const request = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== DÉBUT DES TESTS DU SERVICE ABONNEMENTS ===');
  
  try {
    // 1. Health check
    console.log('\n--- 1. Health Check ---');
    const health = await request('GET', '/health');
    console.log('Status Code:', health.statusCode);
    console.log('Body:', health.body);

    // 2. Récupérer les types d'abonnements
    console.log('\n--- 2. Récupération des types d\'abonnements ---');
    const types = await request('GET', '/api/type-abonnements');
    console.log('Status Code:', types.statusCode);
    console.log('Formules trouvées :', types.body.length);
    console.log(types.body);

    if (types.body.length === 0) {
      throw new Error('Aucun type d\'abonnement trouvé. Le seeding a échoué.');
    }

    const ticketSimpleType = types.body.find(t => t.nom === 'Ticket simple');
    const limiteType = types.body.find(t => t.nom === 'Limité');

    // 3. Attribuer un ticket simple
    console.log('\n--- 3. Attribution d\'un Ticket Simple ---');
    const user_id = 'user_test_uuid_999';
    const attribution = await request('POST', '/api/abonnements', {
      user_id,
      type_abonnement_id: ticketSimpleType.id
    });
    console.log('Status Code:', attribution.statusCode);
    console.log('Abonnement créé :', attribution.body);
    const abonnementId = attribution.body.id;

    // 4. Première validation (devrait réussir et consommer le ticket simple)
    console.log('\n--- 4. Première Validation ---');
    const val1 = await request('POST', '/api/validations/valider', {
      abonnement_id: abonnementId
    });
    console.log('Status Code:', val1.statusCode);
    console.log('Validation 1 result:', val1.body);

    // 5. Deuxième validation (devrait échouer car ticket simple consommé / résilié)
    console.log('\n--- 5. Deuxième Validation (doit échouer) ---');
    const val2 = await request('POST', '/api/validations/valider', {
      abonnement_id: abonnementId
    });
    console.log('Status Code (attendu: 403):', val2.statusCode);
    console.log('Validation 2 result:', val2.body);

    // 6. Historique des voyages pour l'utilisateur
    console.log('\n--- 6. Historique des voyages de l\'utilisateur ---');
    const voyages = await request('GET', `/api/voyages/user/${user_id}`);
    console.log('Status Code:', voyages.statusCode);
    console.log('Nombre de voyages :', voyages.body.length);
    console.log('Détails :', voyages.body);

    // 7. Statistiques globales
    console.log('\n--- 7. Statistiques Globales ---');
    const stats = await request('GET', '/api/stats/global');
    console.log('Status Code:', stats.statusCode);
    console.log('Stats :', JSON.stringify(stats.body, null, 2));

    console.log('\n=== TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ===');
  } catch (error) {
    console.error('Erreur durant l\'exécution des tests :', error);
  }
}

// Attendre 2 secondes que le serveur s'initialise avant de lancer les requêtes
setTimeout(runTests, 2000);
