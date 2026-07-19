const express = require('express');
const router = express.Router();
const abonnementController = require('../controllers/abonnementController');

// Routes pour l'attribution, modification et consultation des abonnements
router.post('/', abonnementController.attribuerAbonnement);
router.get('/:id', abonnementController.getAbonnementById);
router.get('/user/:user_id', abonnementController.getAbonnementsByUser);
router.put('/:id/renouveler', abonnementController.renouvelerAbonnement);
router.put('/:id/suspendre', abonnementController.suspendreAbonnement);
router.put('/:id/resilier', abonnementController.resilierAbonnement);

module.exports = router;
