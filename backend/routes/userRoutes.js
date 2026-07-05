const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
    creerUtilisateur,
    listerUtilisateurs,
    obtenirUtilisateur,
    activerUtilisateur,
    bloquerUtilisateur,
    supprimerUtilisateur,
    activerGroupe,
    bloquerGroupe,
    supprimerGroupe,
} = require('../controllers/userController');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Actions groupées (AVANT les routes avec :id pour éviter les conflits)
router.put('/groupe/activer', activerGroupe);
router.put('/groupe/bloquer', bloquerGroupe);
router.put('/groupe/supprimer', supprimerGroupe);

// CRUD
router.post('/', creerUtilisateur);
router.get('/', listerUtilisateurs);
router.get('/:id', obtenirUtilisateur);
router.put('/:id/activer', activerUtilisateur);
router.put('/:id/bloquer', bloquerUtilisateur);
router.delete('/:id', supprimerUtilisateur);

module.exports = router;