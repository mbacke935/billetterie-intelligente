const jwt = require('jsonwebtoken');

// Vérifie le JWT émis par le Service Utilisateurs (même JWT_SECRET partagé).
// Ce service ne possède pas la collection User (il ne stocke que des user_id, cf.
// modèle Abonnement), donc pas de lookup en base ici : seule la signature/expiration
// du token est vérifiée, et { id, role } du payload est attaché à la requête.
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

module.exports = authMiddleware;
