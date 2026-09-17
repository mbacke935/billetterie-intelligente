const express = require('express');
const router = express.Router();
const validationsController = require('../controllers/validationsController');
const autoriserRoles = require('../middlewares/roleMiddleware');
const { limiteurValidation } = require('../middlewares/rateLimiter');

// Scan et validation : réservés aux agents et administrateurs (jamais à un client).
router.post('/scanner', autoriserRoles('agent', 'admin'), limiteurValidation, validationsController.scannerEtValider);
router.post('/manuelle', autoriserRoles('agent', 'admin'), limiteurValidation, validationsController.validerManuellement);

// Historique global (tous clients confondus) : réservé aux agents et administrateurs.
router.get('/', autoriserRoles('agent', 'admin'), validationsController.listerValidations);

// Historique d'un client donné : agent/admin peuvent consulter n'importe quel client ;
// un client authentifié peut consulter le sien (c'est son historique de déplacements),
// vérifié dans le contrôleur.
router.get('/client/:client_id', autoriserRoles('agent', 'admin', 'client'), validationsController.listerValidationsParClient);

module.exports = router;
