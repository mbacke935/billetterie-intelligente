const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true,
    },
    prenom: {
        type: String,
        required: [true, 'Le prénom est requis'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    telephone: {
        type: String,
        required: [true, 'Le téléphone est requis'],
        unique: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['admin', 'agent', 'client'],
        default: 'client',
    },
    photo: {
        type: String,
        default: null,
    },
    motDePasse: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
    },
    statut: {
        type: String,
        enum: ['actif', 'bloque', 'supprime'],
        default: 'bloque',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);