const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const autoriserRoles = require('../middlewares/roleMiddleware');

// Tableau de bord : outil opérationnel pour agents et administrateurs, pas pour un client.
router.get('/global', autoriserRoles('agent', 'admin'), statsController.getGlobalStats);

module.exports = router;
