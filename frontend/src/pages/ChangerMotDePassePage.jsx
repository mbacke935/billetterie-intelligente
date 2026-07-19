import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const ChangerMotDePassePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmerMotDePasse: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    ancien: false,
    nouveau: false,
    confirmer: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.nouveauMotDePasse !== formData.confirmerMotDePasse) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.nouveauMotDePasse.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/profile/password', {
        ancienMotDePasse: formData.ancienMotDePasse,
        nouveauMotDePasse: formData.nouveauMotDePasse,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
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
            <Lock size={36} />
          </div>
          <h1 className="login-title">Première connexion</h1>
          <p className="login-subtitle">
            Pour des raisons de sécurité, veuillez changer votre mot de passe temporaire.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">

          {/* Mot de passe temporaire */}
          <div className="form-group">
            <label className="form-label">Mot de passe temporaire</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPasswords.ancien ? 'text' : 'password'}
                name="ancienMotDePasse"
                className="form-input form-input-icon"
                placeholder="••••••••"
                value={formData.ancienMotDePasse}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => toggleShow('ancien')}
              >
                {showPasswords.ancien ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div className="form-group">
            <label className="form-label">Nouveau mot de passe</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPasswords.nouveau ? 'text' : 'password'}
                name="nouveauMotDePasse"
                className="form-input form-input-icon"
                placeholder="••••••••"
                value={formData.nouveauMotDePasse}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => toggleShow('nouveau')}
              >
                {showPasswords.nouveau ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmer le mot de passe */}
          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPasswords.confirmer ? 'text' : 'password'}
                name="confirmerMotDePasse"
                className="form-input form-input-icon"
                placeholder="••••••••"
                value={formData.confirmerMotDePasse}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => toggleShow('confirmer')}
              >
                {showPasswords.confirmer ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default ChangerMotDePassePage;