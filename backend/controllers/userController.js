const bcrypt = require('bcrypt');
const { Readable } = require('stream');
const csv = require('csv-parser');
const User = require('../models/User');

const generatePassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');

const ROLES_VALIDES = ['admin', 'agent', 'client'];

// Parse un buffer CSV en tableau d'objets ligne, en gérant virgules/guillemets correctement
const parserCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const lignes = [];
    Readable.from(buffer)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (ligne) => lignes.push(ligne))
      .on('end', () => resolve(lignes))
      .on('error', reject);
  });
};

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

// POST /api/users/import - Importer plusieurs utilisateurs via un fichier CSV
// Colonnes attendues : nom, prenom, email, telephone, role
const importerUtilisateursCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier CSV envoyé.' });
    }

    let lignes;
    try {
      lignes = await parserCSV(req.file.buffer);
    } catch (err) {
      return res.status(400).json({ message: 'Fichier CSV invalide.', error: err.message });
    }

    // Le rôle peut être imposé par la page appelante (ex. import CSV dans "Agents")
    // et prévaut alors sur la colonne "role" éventuellement présente dans le fichier.
    const roleImpose = ROLES_VALIDES.includes(req.body.role) ? req.body.role : null;

    let success = 0;
    let errors = 0;
    const errorMessages = [];

    for (let i = 0; i < lignes.length; i++) {
      const numeroLigne = i + 2; // +1 pour l'en-tête, +1 pour l'index 0-based
      const { nom, prenom, email, telephone, role } = lignes[i];

      if (!nom || !prenom || !email || !telephone) {
        errors++;
        errorMessages.push(`Ligne ${numeroLigne} : nom, prenom, email et telephone sont requis.`);
        continue;
      }

      const roleFinal = roleImpose || (ROLES_VALIDES.includes(role) ? role : 'client');

      try {
        const emailExiste = await User.findOne({ email });
        if (emailExiste) {
          throw new Error('Cet email est déjà utilisé.');
        }
        const telExiste = await User.findOne({ telephone });
        if (telExiste) {
          throw new Error('Ce numéro de téléphone est déjà utilisé.');
        }

        const motDePasseTemp = generatePassword(8);
        const hash = await bcrypt.hash(motDePasseTemp, 10);

        await User.create({
          nom,
          prenom,
          email,
          telephone,
          role: roleFinal,
          motDePasse: hash,
          statut: 'bloque',
        });

        success++;
      } catch (err) {
        errors++;
        errorMessages.push(`Ligne ${numeroLigne} (${email}) : ${err.message}`);
      }
    }

    res.status(200).json({
      message: `Import terminé : ${success} utilisateur(s) créé(s), ${errors} erreur(s).`,
      success,
      errors,
      errorMessages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/users - Consulter la liste des utilisateurs (avec filtres)
const listerUtilisateurs = async(req, res) => {
    try {
        const { role, statut, email, telephone, id, ids, search } = req.query;
        const filtre = {};

        if (role) filtre.role = role;
        if (statut) filtre.statut = statut;
        if (email) filtre.email = email;
        if (telephone) filtre.telephone = telephone;
        if (id) filtre._id = id;
        // ids : liste d'identifiants séparés par des virgules, pour récupérer en un
        // seul appel les utilisateurs correspondant à un lot d'abonnements par exemple.
        if (ids) {
            const idsValides = ids.split(',').map((v) => v.trim()).filter((v) => /^[0-9a-fA-F]{24}$/.test(v));
            filtre._id = { $in: idsValides };
        }

        // Recherche libre côté serveur : nom, prénom, email, téléphone (et identifiant si valide)
        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const ou = [{ nom: regex }, { prenom: regex }, { email: regex }, { telephone: regex }];
            if (/^[0-9a-fA-F]{24}$/.test(search)) {
                ou.push({ _id: search });
            }
            filtre.$or = ou;
        }

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

// DELETE /api/users/:id - Supprimer définitivement un compte
const supprimerUtilisateur = async(req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id).select('-motDePasse');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ message: 'Compte supprimé définitivement.', user });
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

// DELETE /api/users/groupe/supprimer - Supprimer définitivement plusieurs comptes
const supprimerGroupe = async(req, res) => {
    try {
        const { ids } = req.body;

        const result = await User.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            message: `${result.deletedCount} compte(s) supprimé(s) définitivement.`,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = {
    creerUtilisateur,
    importerUtilisateursCSV,
    listerUtilisateurs,
    obtenirUtilisateur,
    activerUtilisateur,
    bloquerUtilisateur,
    supprimerUtilisateur,
    activerGroupe,
    bloquerGroupe,
    supprimerGroupe,
};