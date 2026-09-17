// Middleware factory : n'autorise la requête que si req.user.role fait partie des rôles
// fournis (mêmes conventions que billetterie-service/middlewares/roleMiddleware.js).
const autoriserRoles = (...rolesAutorises) => (req, res, next) => {
  if (!req.user || !rolesAutorises.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé : rôle insuffisant pour cette action.' });
  }
  next();
};

module.exports = autoriserRoles;
