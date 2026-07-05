const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async(req, res, next) => {
    try {
        // Vérifier si le token existe dans le header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
        }

        // Extraire le token (enlever "Bearer ")
        const token = authHeader.split(' ')[1];

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Chercher l'utilisateur en base (sans le mot de passe)
        const user = await User.findById(decoded.id).select('-motDePasse');

        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé.' });
        }

        if (user.statut !== 'actif') {
            return res.status(403).json({ message: 'Compte non actif.' });
        }

        // Ajouter l'utilisateur à la requête pour les prochains middlewares/contrôleurs
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
};

module.exports = authMiddleware;