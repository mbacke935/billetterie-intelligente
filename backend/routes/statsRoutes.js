const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getStatistiques } = require('../controllers/statsController');

router.get('/', authMiddleware, getStatistiques);

module.exports = router;