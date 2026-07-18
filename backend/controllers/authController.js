const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generatePassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');

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

// POST /api/auth/register
const register = async(req, res) => {
    try {
        const { nom, prenom, email, telephone, motDePasse } = req.body;

        // Validation des champs requis
        if (!nom || !prenom || !email || !telephone || !motDePasse) {
            return res.status(400).json({ message: 'Tous les champs sont requis.' });
        }

        // Vérifier si l'email existe déjà
        const emailExiste = await User.findOne({ email });
        if (emailExiste) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Vérifier si le téléphone existe déjà
        const telExiste = await User.findOne({ telephone });
        if (telExiste) {
            return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé.' });
        }

        // Hasher le mot de passe
        const hash = await bcrypt.hash(motDePasse, 10);

        // Créer le client (statut 'bloque' par défaut)
        const user = await User.create({
            nom,
            prenom,
            email,
            telephone,
            role: 'client',
            motDePasse: hash,
            statut: 'bloque'
        });

        // Répondre sans le mot de passe
        const userSansMotDePasse = user.toObject();
        delete userSansMotDePasse.motDePasse;

        res.status(201).json({
            message: 'Inscription réussie. Votre compte est en attente d\'activation par un administrateur.',
            user: userSansMotDePasse
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { login, logout, register };