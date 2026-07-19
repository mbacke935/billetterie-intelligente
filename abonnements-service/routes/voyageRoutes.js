const express = require('express');
const router = express.Router();
const voyageController = require('../controllers/voyageController');

// Routes pour consulter l'historique des consommations de voyages
router.get('/user/:user_id', voyageController.getVoyagesByUser);
router.get('/abonnement/:abonnement_id', voyageController.getVoyagesByAbonnement);

module.exports = router;
