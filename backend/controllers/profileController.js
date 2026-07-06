const bcrypt = require('bcrypt');
const User = require('../models/User');

// GET /api/profile - Obtenir mon profil
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-motDePasse');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// PUT /api/profile - Modifier mon profil
const updateProfile = async (req, res) => {
    try {
        const { nom, prenom, email, telephone } = req.body;

        // Vérifier si l'email est déjà pris par un autre utilisateur
        if (email) {
            const emailExiste = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (emailExiste) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
            }
        }

        // Vérifier si le téléphone est déjà pris par un autre utilisateur
        if (telephone) {
            const telExiste = await User.findOne({ telephone, _id: { $ne: req.user._id } });
            if (telExiste) {
                return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé.' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { nom, prenom, email, telephone },
            { new: true, runValidators: true }
        ).select('-motDePasse');

        res.status(200).json({
            message: 'Profil mis à jour avec succès.',
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// PUT /api/profile/password - Changer mon mot de passe
const changePassword = async (req, res) => {
    try {
        const { ancienMotDePasse, nouveauMotDePasse } = req.body;

        if (!ancienMotDePasse || !nouveauMotDePasse) {
            return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis.' });
        }

        if (nouveauMotDePasse.length < 6) {
            return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
        }

        // Récupérer l'utilisateur avec le mot de passe
        const user = await User.findById(req.user._id);

        // Vérifier l'ancien mot de passe
        const motDePasseValide = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
        if (!motDePasseValide) {
            return res.status(401).json({ message: 'Ancien mot de passe incorrect.' });
        }

        // Hasher le nouveau mot de passe
        const hash = await bcrypt.hash(nouveauMotDePasse, 10);
        user.motDePasse = hash;
        await user.save();

        res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// POST /api/profile/photo - Upload photo de profil
const uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier envoyé.' });
        }

        const photoUrl = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { photo: photoUrl },
            { new: true }
        ).select('-motDePasse');

        res.status(200).json({
            message: 'Photo mise à jour avec succès.',
            user,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getProfile, updateProfile, changePassword, uploadPhoto };
