const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes publiques (pas besoin de token)
router.post('/login', login);

// Routes protégées (token requis)
router.post('/logout', authMiddleware, logout);

module.exports = router;