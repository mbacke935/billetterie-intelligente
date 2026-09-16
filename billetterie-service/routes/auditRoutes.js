const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const autoriserRoles = require('../middlewares/roleMiddleware');

// Piste d'audit : consultation réservée aux administrateurs
router.get('/', autoriserRoles('admin'), auditController.listerAudit);

module.exports = router;
