import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathForRole } from '../utils/roles';

// `roles` (optionnel) restreint l'accès à un espace donné (admin/agent/client). Un
// utilisateur authentifié mais dont le rôle ne correspond pas est renvoyé vers SON PROPRE
// espace plutôt que vers /login, pour éviter une boucle de redirection incompréhensible.
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
