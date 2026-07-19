import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import { Ticket, Mail, Lock, Eye, EyeOff } from 'lucide-react';
=======
import { Ticket, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Traduit les codes d'erreur du backend en messages clairs et cible le champ concerné
const parseError = (err) => {
  const message = err.response?.data?.message || '';
  const status = err.response?.status;

  if (status === 400) {
    return { field: 'both', message: 'Veuillez renseigner l\'email et le mot de passe.' };
  }
  if (message.toLowerCase().includes('supprimé') || message.toLowerCase().includes('supprime')) {
    return { field: null, message: 'Ce compte a été supprimé. Contactez un administrateur.' };
  }
  if (message.toLowerCase().includes('bloqué') || message.toLowerCase().includes('bloque')) {
    return { field: null, message: 'Votre compte est bloqué. Contactez un administrateur.' };
  }
  // Seulement le mot de passe est faux → garder l'email
  if (message.toLowerCase().includes('mot de passe')) {
    return { field: 'password', message: 'Mot de passe incorrect. Veuillez réessayer.' };
  }
  // Email introuvable → vider les deux champs
  if (message.toLowerCase().includes('email')) {
    return { field: 'both', message: 'Aucun compte trouvé avec cet email.' };
  }
  if (!err.response) {
    return { field: null, message: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
  }
  return { field: null, message: message || 'Une erreur est survenue. Réessayez.' };
};
>>>>>>> Stashed changes

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
<<<<<<< Updated upstream
  const [error, setError] = useState('');
  const [emailVerifie, setEmailVerifie] = useState(false);
=======
  const [error, setError] = useState(null);
>>>>>>> Stashed changes
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, motDePasse);

      // Si c'est la première connexion → changer le mot de passe
      if (data.premiereConnexion) {
        navigate('/changer-mot-de-passe');
      } else {
        navigate('/');
      }
    } catch (err) {
<<<<<<< Updated upstream
      const message = err.response?.data?.message || 'Erreur de connexion.';

      // Si l'email est incorrect → vider les deux champs
      if (message.includes('Email ou mot de passe incorrect') && !emailVerifie) {
        setError('Aucun compte trouvé avec cet email.');
        setEmail('');
        setMotDePasse('');
        setEmailVerifie(false);
      }
      // Si le mot de passe est incorrect → garder l'email, vider seulement le mot de passe
      else {
        setError('Mot de passe incorrect. Veuillez réessayer.');
        setMotDePasse('');
        setEmailVerifie(true);
      }
=======
      const parsed = parseError(err);

      // Mot de passe incorrect → vider seulement le mot de passe, garder l'email
      if (parsed.field === 'password') {
        setMotDePasse('');
      }

      // Email incorrect ou les deux → vider les deux champs
      if (parsed.field === 'both') {
        setMotDePasse('');
        setEmail('');
      }

      setError(parsed);
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="login-shape login-shape-1" />
        <div className="login-shape login-shape-2" />
        <div className="login-shape login-shape-3" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Ticket size={36} />
          </div>
          <h1 className="login-title">Billetterie Intelligente</h1>
          <p className="login-subtitle">Connectez-vous à votre espace</p>
        </div>

        {/* Message d'erreur persistant */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
            <button
              onClick={() => setError('')}
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
              }}
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input form-input-icon"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
<<<<<<< Updated upstream
                  // Si l'utilisateur change l'email, réinitialiser
                  setEmailVerifie(false);
                  setError('');
=======
                  setError(null);
>>>>>>> Stashed changes
                }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input form-input-icon"
                placeholder="••••••••"
                value={motDePasse}
                onChange={(e) => {
                  setMotDePasse(e.target.value);
<<<<<<< Updated upstream
                  setError('');
=======
                  setError(null);
>>>>>>> Stashed changes
                }}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="btn-spinner" />
                Connexion...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;