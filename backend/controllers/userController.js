const bcrypt = require('bcrypt');
const User = require('../models/User');

// POST /api/users - Créer un utilisateur individuellement
const creerUtilisateur = async(req, res) => {
    try {
        const { nom, prenom, email, telephone, role, motDePasse } = req.body;

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

        // Créer l'utilisateur
        const user = await User.create({
            nom,
            prenom,
            email,
            telephone,
            role,
            motDePasse: hash,
        });

        // Répondre sans le mot de passe
        const userSansMotDePasse = user.toObject();
        delete userSansMotDePasse.motDePasse;

        res.status(201).json({
            message: 'Utilisateur créé avec succès.',
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
const activerUtilisateur = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, { statut: 'actif' }, { new: true }
        ).select('-motDePasse');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ message: 'Compte activé.', user });
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
const activerGroupe = async(req, res) => {
    try {
        const { ids } = req.body;

        const result = await User.updateMany({ _id: { $in: ids } }, { statut: 'actif' });

        res.status(200).json({
            message: `${result.modifiedCount} compte(s) activé(s).`,
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