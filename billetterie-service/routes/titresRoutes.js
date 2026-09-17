const express = require('express');
const router = express.Router();
const titresController = require('../controllers/titresController');
const autoriserRoles = require('../middlewares/roleMiddleware');

// Listing/recherche globale : réservée aux agents et administrateurs (un client n'a pas à
// parcourir les titres des autres usagers).
router.get('/', autoriserRoles('agent', 'admin'), titresController.listerTitres);

// Consultation d'un titre précis (et de son QR Code) : ouverte au client, mais uniquement
// pour SON PROPRE titre (vérifié dans le contrôleur via client_id) — c'est ce qui lui permet
// de retrouver et présenter son QR Code depuis l'espace client.
router.get('/by-abonnement/:abonnement_id', autoriserRoles('agent', 'admin', 'client'), titresController.obtenirTitreParAbonnement);
router.get('/:id', autoriserRoles('agent', 'admin', 'client'), titresController.obtenirTitre);
router.get('/:id/qrcode', autoriserRoles('agent', 'admin', 'client'), titresController.genererQrCode);

// Génération : un admin génère un titre pour n'importe quel client ; un client peut générer
// le sien immédiatement après avoir souscrit lui-même à un abonnement (le contrôleur vérifie
// qu'il en est bien le propriétaire auprès du Service Abonnements). Désactivation/réactivation
// restent des opérations sensibles réservées aux admins.
router.post('/', autoriserRoles('admin', 'client'), titresController.genererTitre);
router.put('/:id/desactiver', autoriserRoles('admin'), titresController.desactiverTitre);
router.put('/:id/activer', autoriserRoles('admin'), titresController.activerTitre);

module.exports = router;
