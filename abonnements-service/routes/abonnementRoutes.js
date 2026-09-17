const express = require('express');
const router = express.Router();
const abonnementController = require('../controllers/abonnementController');
const autoriserRoles = require('../middlewares/roleMiddleware');

// Attribution/achat : un admin attribue un abonnement à n'importe quel client ; un client
// ne peut s'abonner que pour lui-même (le contrôleur force user_id = req.user.id dans ce cas).
router.post('/', autoriserRoles('admin', 'client'), abonnementController.attribuerAbonnement);

// Liste globale et filtres avancés : outil de gestion réservé aux agents/administrateurs.
router.get('/', autoriserRoles('agent', 'admin'), abonnementController.getAllAbonnements);

// Consultation d'un abonnement ou des abonnements d'un utilisateur : un client ne peut
// consulter que les siens (vérifié dans le contrôleur), un agent/admin peut consulter tout le monde.
router.get('/:id', autoriserRoles('agent', 'admin', 'client'), abonnementController.getAbonnementById);
router.get('/user/:user_id', autoriserRoles('agent', 'admin', 'client'), abonnementController.getAbonnementsByUser);

// Correction, suspension, résiliation : actions de gestion réservées aux administrateurs.
router.put('/:id', autoriserRoles('admin'), abonnementController.modifierAbonnement);
router.put('/:id/renouveler', autoriserRoles('admin'), abonnementController.renouvelerAbonnement);
router.put('/:id/suspendre', autoriserRoles('admin'), abonnementController.suspendreAbonnement);
router.put('/:id/resilier', autoriserRoles('admin'), abonnementController.resilierAbonnement);

// Utilisé exclusivement par le Service Billetterie lors d'une validation de QR Code
// (le token relayé est celui de l'agent/admin qui a effectué le scan).
router.post('/:id/consommer-voyage', autoriserRoles('agent', 'admin'), abonnementController.consommerVoyage);

module.exports = router;
