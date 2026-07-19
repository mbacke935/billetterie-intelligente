const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connecté.');

        // Vérifier si l'admin existe déjà
        const adminExiste = await User.findOne({ email: 'admin@billetterie.com' });

        if (adminExiste) {
            console.log('Admin existe déjà.');
            process.exit();
        }

        // Hasher le mot de passe
        const hash = await bcrypt.hash('Admin1234', 10);

        // Créer l'admin
        await User.create({
        nom: 'Admin',
        prenom: 'Principal',
        email: 'admin@billetterie.com',
        telephone: '0600000000',
        role: 'admin',
        motDePasse: hash,
        statut: 'actif',
        premiereConnexion: false,  // Ajouter cette ligne
        });

        console.log('Admin créé avec succès !');
        console.log('Email : admin@billetterie.com');
        console.log('Mot de passe : Admin1234');
        process.exit();
    } catch (error) {
        console.error('Erreur :', error.message);
        process.exit(1);
    }
};

seedAdmin();