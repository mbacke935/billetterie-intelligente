const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Route pour obtenir les indicateurs de statistiques
router.get('/global', statsController.getGlobalStats);

module.exports = router;
