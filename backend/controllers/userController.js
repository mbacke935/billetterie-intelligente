const bcrypt = require('bcrypt');
const User = require('../models/User');

const generatePassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');

// POST /api/users - Créer un utilisateur individuellement
const creerUtilisateur = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, role } = req.body;

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

    // Générer un mot de passe temporaire par défaut
    // (sera remplacé lors de l'activation du compte)
    const motDePasseTemp = generatePassword(8);
    const hash = await bcrypt.hash(motDePasseTemp, 10);

    // Créer l'utilisateur avec statut bloqué par défaut
    const user = await User.create({
      nom,
      prenom,
      email,
      telephone,
      role,
      motDePasse: hash,
      statut: 'bloque',
    });

    const userSansMotDePasse = user.toObject();
    delete userSansMotDePasse.motDePasse;

    res.status(201).json({
      message: 'Utilisateur créé avec succès. Le compte doit être activé par un administrateur.',
      user: userSansMotDePasse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/users - Consulter la liste des utilisateurs (avec filtres)
const listerUtilisateurs = async(req, res) => {
    try {
        const { role, statut, email, telephone, id } = req.query;
        const filtre = {};

        if (role) filtre.role = role;
        if (statut) filtre.statut = statut;
        if (email) filtre.email = email;
        if (telephone) filtre.telephone = telephone;
        if (id) filtre._id = id;

        const users = await User.find(filtre).select('-motDePasse');

        res.status(200).json({
            total: users.length,
            users,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// GET /api/users/:id - Consulter un utilisateur par ID
const obtenirUtilisateur = async(req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-motDePasse');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// PUT /api/users/:id/activer - Activer un compte
// PUT /api/users/:id/activer - Activer un compte avec envoi d'e-mail
const activerUtilisateur = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Générer un mot de passe temporaire de 8 caractères
        const motDePasseTemp = generatePassword(8);

        // Hasher le mot de passe temporaire
        const hash = await bcrypt.hash(motDePasseTemp, 10);

        // Mettre à jour le statut et le mot de passe
        user.statut = 'actif';
        user.motDePasse = hash;
        await user.save();

        // Envoyer l'e-mail avec les informations d'accès
        const contenuEmail = `
      <h2>Bienvenue sur la plateforme Billetterie Intelligente</h2>
      <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
      <p>Votre compte a été activé avec succès.</p>
      <p>Voici vos informations d'accès :</p>
      <ul>
        <li><strong>Email :</strong> ${user.email}</li>
        <li><strong>Mot de passe temporaire :</strong> ${motDePasseTemp}</li>
      </ul>
      <p>Pour des raisons de sécurité, veuillez modifier votre mot de passe lors de votre première connexion.</p>
      <p>Cordialement,<br>L'équipe Billetterie Intelligente</p>
    `;

        await sendEmail(user.email, 'Activation de votre compte', contenuEmail);

        res.status(200).json({
            message: 'Compte activé et e-mail envoyé.',
            user: {
                id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                statut: user.statut,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// PUT /api/users/:id/bloquer - Bloquer un compte
const bloquerUtilisateur = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, { statut: 'bloque' }, { new: true }
        ).select('-motDePasse');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ message: 'Compte bloqué.', user });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// DELETE /api/users/:id - Supprimer un compte
const supprimerUtilisateur = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, { statut: 'supprime' }, { new: true }
        ).select('-motDePasse');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ message: 'Compte supprimé.', user });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// PUT /api/users/groupe/activer - Activer plusieurs comptes
// PUT /api/users/groupe/activer - Activer plusieurs comptes avec envoi d'e-mails
const activerGroupe = async(req, res) => {
    try {
        const { ids } = req.body;
        let compteur = 0;

        for (const id of ids) {
            const user = await User.findById(id);

            if (user && user.statut !== 'actif') {
                const motDePasseTemp = generatePassword(8);
                const hash = await bcrypt.hash(motDePasseTemp, 10);

                user.statut = 'actif';
                user.motDePasse = hash;
                await user.save();

                const contenuEmail = `
          <h2>Bienvenue sur la plateforme Billetterie Intelligente</h2>
          <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
          <p>Votre compte a été activé avec succès.</p>
          <p>Voici vos informations d'accès :</p>
          <ul>
            <li><strong>Email :</strong> ${user.email}</li>
            <li><strong>Mot de passe temporaire :</strong> ${motDePasseTemp}</li>
          </ul>
          <p>Veuillez modifier votre mot de passe lors de votre première connexion.</p>
        `;

                await sendEmail(user.email, 'Activation de votre compte', contenuEmail);
                compteur++;
            }
        }

        res.status(200).json({
            message: `${compteur} compte(s) activé(s) et e-mail(s) envoyé(s).`,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// PUT /api/users/groupe/bloquer - Bloquer plusieurs comptes
const bloquerGroupe = async(req, res) => {
    try {
        const { ids } = req.body;

        const result = await User.updateMany({ _id: { $in: ids } }, { statut: 'bloque' });

        res.status(200).json({
            message: `${result.modifiedCount} compte(s) bloqué(s).`,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

// DELETE /api/users/groupe/supprimer - Supprimer plusieurs comptes
const supprimerGroupe = async(req, res) => {
    try {
        const { ids } = req.body;

        const result = await User.updateMany({ _id: { $in: ids } }, { statut: 'supprime' });

        res.status(200).json({
            message: `${result.modifiedCount} compte(s) supprimé(s).`,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = {
    creerUtilisateur,
    listerUtilisateurs,
    obtenirUtilisateur,
    activerUtilisateur,
    bloquerUtilisateur,
    supprimerUtilisateur,
    activerGroupe,
    bloquerGroupe,
    supprimerGroupe,
};