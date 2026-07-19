const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generatePassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (user.statut === 'supprime') {
      return res.status(403).json({ message: 'Ce compte a été supprimé.' });
    }

    if (user.statut === 'bloque') {
      return res.status(403).json({ message: 'Ce compte est bloqué. Contactez un administrateur.' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, user.motDePasse);

    if (!motDePasseValide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Connexion réussie.',
      token,
      // Indiquer au frontend si c'est la première connexion
      premiereConnexion: user.premiereConnexion,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        photo: user.photo,
        statut: user.statut,
        premiereConnexion: user.premiereConnexion,
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

// POST /api/auth/forgot-password
const forgotPassword = async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'L\'email est requis.' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cette adresse email.' });
        }

        // Générer un mot de passe temporaire de 8 caractères
        const motDePasseTemp = generatePassword(8);
        const hash = await bcrypt.hash(motDePasseTemp, 10);

        user.motDePasse = hash;
        await user.save();

        // Envoyer l'email
        const contenuEmail = `
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour l'application Billetterie Intelligente.</p>
            <p>Voici votre nouveau mot de passe temporaire :</p>
            <ul>
                <li><strong>Mot de passe temporaire :</strong> ${motDePasseTemp}</li>
            </ul>
            <p>Pour des raisons de sécurité, veuillez modifier ce mot de passe dès votre première connexion.</p>
            <p>Cordialement,<br>L'équipe Billetterie Intelligente</p>
        `;

        await sendEmail(user.email, 'Réinitialisation de votre mot de passe', contenuEmail);

        res.status(200).json({ message: 'Un nouveau mot de passe temporaire vous a été envoyé par e-mail.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { login, logout, register, forgotPassword };