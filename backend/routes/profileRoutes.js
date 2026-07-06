const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
    getProfile,
    updateProfile,
    changePassword,
    uploadPhoto,
} = require('../controllers/profileController');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.post('/photo', upload.single('photo'), uploadPhoto);

module.exports = router;
