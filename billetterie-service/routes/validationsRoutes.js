const express = require('express');
const router = express.Router();
const validationsController = require('../controllers/validationsController');
const autoriserRoles = require('../middlewares/roleMiddleware');
const { limiteurValidation } = require('../middlewares/rateLimiter');

// Scan et validation : réservés aux agents et administrateurs (jamais à un client).
router.post('/scanner', autoriserRoles('agent', 'admin'), limiteurValidation, validationsController.scannerEtValider);
router.post('/manuelle', autoriserRoles('agent', 'admin'), limiteurValidation, validationsController.validerManuellement);

// Historique / consultation : idem, réservé aux agents et administrateurs.
router.get('/', autoriserRoles('agent', 'admin'), validationsController.listerValidations);
router.get('/client/:client_id', autoriserRoles('agent', 'admin'), validationsController.listerValidationsParClient);

module.exports = router;
