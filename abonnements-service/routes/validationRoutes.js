const express = require('express');
const router = express.Router();
const validationController = require('../controllers/validationController');

// Route de validation d'un abonnement / ticket
router.post('/valider', validationController.validerAbonnement);

module.exports = router;
