import { useState } from 'react';
import { X } from 'lucide-react';

const roleLabels = {
  admin: 'Administrateur',
  agent: 'Agent',
  client: 'Client',
};

const UserForm = ({ onSubmit, onClose, roleDefaut = 'client' }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: roleDefaut,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nouvel utilisateur</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Info sur l'activation */}
        <div className="alert alert-info" style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
          ℹ️ Le mot de passe sera généré automatiquement lors de l'activation du compte.
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                type="text"
                name="nom"
                className="form-input"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                name="prenom"
                className="form-input"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                name="telephone"
                className="form-input"
                value={formData.telephone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Rôle en lecture seule — déterminé par la page */}
          <div className="form-group">
            <label className="form-label">Rôle</label>
            <input
              type="text"
              className="form-input"
              value={roleLabels[roleDefaut]}
              readOnly
              style={{ backgroundColor: 'var(--bg-secondary, #f1f5f9)', cursor: 'not-allowed', opacity: 0.8 }}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;