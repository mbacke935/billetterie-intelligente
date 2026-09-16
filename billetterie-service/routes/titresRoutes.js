const express = require('express');
const router = express.Router();
const titresController = require('../controllers/titresController');
const autoriserRoles = require('../middlewares/roleMiddleware');

// Consultation : réservée aux agents et administrateurs (un client n'a pas à parcourir
// les titres/QR Codes des autres usagers).
router.get('/', autoriserRoles('agent', 'admin'), titresController.listerTitres);
router.get('/by-abonnement/:abonnement_id', autoriserRoles('agent', 'admin'), titresController.obtenirTitreParAbonnement);
router.get('/:id', autoriserRoles('agent', 'admin'), titresController.obtenirTitre);
router.get('/:id/qrcode', autoriserRoles('agent', 'admin'), titresController.genererQrCode);

// Génération et désactivation/réactivation : opérations sensibles réservées aux admins
router.post('/', autoriserRoles('admin'), titresController.genererTitre);
router.put('/:id/desactiver', autoriserRoles('admin'), titresController.desactiverTitre);
router.put('/:id/activer', autoriserRoles('admin'), titresController.activerTitre);

module.exports = router;
