const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadCSV } = require('../middlewares/uploadMiddleware');
const {
    creerUtilisateur,
    importerUtilisateursCSV,
    listerUtilisateurs,
    obtenirUtilisateur,
    activerUtilisateur,
    bloquerUtilisateur,
    supprimerUtilisateur,
    restaurerUtilisateur,
    supprimerDefinitivement,
    activerGroupe,
    bloquerGroupe,
    supprimerGroupe,
    restaurerGroupe,
    supprimerDefinitivementGroupe,
} = require('../controllers/userController');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Actions groupées (AVANT les routes avec :id pour éviter les conflits)
router.put('/groupe/activer', activerGroupe);
router.put('/groupe/bloquer', bloquerGroupe);
router.put('/groupe/supprimer', supprimerGroupe);
router.put('/groupe/restaurer', restaurerGroupe);
router.delete('/groupe/definitif', supprimerDefinitivementGroupe);

// CRUD
router.post('/import', uploadCSV.single('fichier'), importerUtilisateursCSV);
router.post('/', creerUtilisateur);
router.get('/', listerUtilisateurs);
router.get('/:id', obtenirUtilisateur);
router.put('/:id/activer', activerUtilisateur);
router.put('/:id/bloquer', bloquerUtilisateur);
router.put('/:id/restaurer', restaurerUtilisateur);
router.delete('/:id/definitif', supprimerDefinitivement);
router.delete('/:id', supprimerUtilisateur);

module.exports = router;
