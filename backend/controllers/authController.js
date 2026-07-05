const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login
const login = async(req, res) => {
    try {
        const { email, motDePasse } = req.body;

        // Vérifier que les champs sont remplis
        if (!email || !motDePasse) {
            return res.status(400).json({ message: 'Email et mot de passe requis.' });
        }

        // Chercher l'utilisateur par email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Vérifier le statut du compte
        if (user.statut === 'supprime') {
            return res.status(403).json({ message: 'Ce compte a été supprimé.' });
        }

        if (user.statut === 'bloque') {
            return res.status(403).json({ message: 'Ce compte est bloqué. Contactez un administrateur.' });
        }

        // Comparer le mot de passe avec le hash en base
        const motDePasseValide = await bcrypt.compare(motDePasse, user.motDePasse);

        if (!motDePasseValide) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Générer le token JWT
        const token = jwt.sign({ id: user._id, role: user.role },
            process.env.JWT_SECRET, { expiresIn: '24h' }
        );

        // Répondre avec le token et les infos utilisateur (sans le mot de passe)
        res.status(200).json({
            message: 'Connexion réussie.',
            token,
            user: {
                id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                telephone: user.telephone,
                role: user.role,
                photo: user.photo,
                statut: user.statut,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// POST /api/auth/logout
const logout = async(req, res) => {
    // Avec JWT, le logout se fait côté client en supprimant le token
    // Côté serveur on confirme simplement la déconnexion
    res.status(200).json({ message: 'Déconnexion réussie.' });
};

module.exports = { login, logout };