// Middleware factory : n'autorise la requête que si req.user.role fait partie des rôles
// fournis. Exige un rôle valide, sinon 403 — c'est ce contrôle qui manquait jusqu'ici dans
// les autres services (aucune restriction par rôle n'y existait avant ce service).
const autoriserRoles = (...rolesAutorises) => (req, res, next) => {
  if (!req.user || !rolesAutorises.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé : rôle insuffisant pour cette action.' });
  }
  next();
};

module.exports = autoriserRoles;
