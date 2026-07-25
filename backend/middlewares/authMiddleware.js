const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

const authMiddleware = async(req, res, next) => {
    try {
        // Vérifier si le token existe dans le header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
        }

        // Extraire le token (enlever "Bearer ")
        const token = authHeader.split(' ')[1];

        // Rejeter les tokens invalidés par un logout précédent
        const estRevoque = await TokenBlacklist.findOne({ token });
        if (estRevoque) {
            return res.status(401).json({ message: 'Token invalide ou expiré.' });
        }

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

        // Ajouter l'utilisateur et le token brut à la requête pour les prochains middlewares/contrôleurs
        req.user = user;
        req.token = token;
        req.tokenExp = decoded.exp;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
};

module.exports = authMiddleware;