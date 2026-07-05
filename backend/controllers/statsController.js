const User = require('../models/User');

// GET /api/stats
const getStatistiques = async(req, res) => {
    try {
        // Statistiques des administrateurs
        const admins = {
            total: await User.countDocuments({ role: 'admin' }),
            actifs: await User.countDocuments({ role: 'admin', statut: 'actif' }),
            bloques: await User.countDocuments({ role: 'admin', statut: 'bloque' }),
            supprimes: await User.countDocuments({ role: 'admin', statut: 'supprime' }),
        };

        // Statistiques des agents
        const agents = {
            total: await User.countDocuments({ role: 'agent' }),
            actifs: await User.countDocuments({ role: 'agent', statut: 'actif' }),
            bloques: await User.countDocuments({ role: 'agent', statut: 'bloque' }),
            supprimes: await User.countDocuments({ role: 'agent', statut: 'supprime' }),
        };

        // Statistiques des clients
        const clients = {
            total: await User.countDocuments({ role: 'client' }),
            actifs: await User.countDocuments({ role: 'client', statut: 'actif' }),
            bloques: await User.countDocuments({ role: 'client', statut: 'bloque' }),
            supprimes: await User.countDocuments({ role: 'client', statut: 'supprime' }),
        };

        // Statistiques globales
        const global = {
            total: admins.total + agents.total + clients.total,
            actifs: admins.actifs + agents.actifs + clients.actifs,
            bloques: admins.bloques + agents.bloques + clients.bloques,
            supprimes: admins.supprimes + agents.supprimes + clients.supprimes,
        };

        res.status(200).json({
            admins,
            agents,
            clients,
            global,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

module.exports = { getStatistiques };