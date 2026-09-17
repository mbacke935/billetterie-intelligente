// Point d'entrée de chaque espace, utilisé après connexion et par les redirections de
// ProtectedRoute lorsqu'un utilisateur atterrit hors de son espace.
export const homePathForRole = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'agent':
      return '/agent/scan';
    case 'client':
      return '/client/titres';
    default:
      return '/login';
  }
};
