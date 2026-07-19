const express = require('express');
const router = express.Router();
const typeAbonnementController = require('../controllers/typeAbonnementController');

// CRUD TypeAbonnement
router.post('/', typeAbonnementController.createTypeAbonnement);
router.get('/', typeAbonnementController.getAllTypeAbonnements);
router.get('/:id', typeAbonnementController.getTypeAbonnementById);
router.put('/:id', typeAbonnementController.updateTypeAbonnement);
router.delete('/:id', typeAbonnementController.deleteTypeAbonnement);

module.exports = router;
