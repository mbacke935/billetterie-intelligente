import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User, Ticket, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Ticket size={28} className="navbar-icon" />
        <h1 className="navbar-title">Billetterie Intelligente</h1>
      </div>

      <div className="navbar-user">
        <button
          className="navbar-theme-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="navbar-user-info" onClick={() => navigate('/profile')}>
          <div className="navbar-avatar">
            {user?.photo ? (
              <img src={user.photo} alt="avatar" className="navbar-avatar-img" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="navbar-user-details">
            <span className="navbar-user-name">{user?.prenom} {user?.nom}</span>
            <span className="navbar-user-role">{user?.role}</span>
          </div>
        </div>

        <button className="navbar-logout-btn" onClick={handleLogout} title="Déconnexion">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
