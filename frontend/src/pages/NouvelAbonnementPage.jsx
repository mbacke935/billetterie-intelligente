import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Save } from 'lucide-react';

const NouvelAbonnementPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clientEmail: '',
    type: 'ticket_simple',
    dateDebut: '',
    dateExpiration: '',
    voyagesAutorises: '',
    tarif: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO : remplacer par l'appel API réel quand MS aura fini le backend
      // await creerAbonnement(formData);
      console.log('Données abonnement :', formData);

      // Simulation succès
      setTimeout(() => {
        setSuccess('Abonnement créé avec succès !');
        setLoading(false);
        setTimeout(() => navigate('/abonnements'), 1500);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
      setLoading(false);
    }
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/abonnements')}
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Nouvel abonnement</h1>
            <p className="page-subtitle">Créer un abonnement ou un ticket pour un client</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '600px' }}>
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{
          background: 'var(--bg-card, #1e293b)',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>

          {/* Email client */}
          <div className="form-group">
            <label className="form-label">Email du client</label>
            <input
              type="email"
              name="clientEmail"
              className="form-input"
              placeholder="client@email.com"
              value={formData.clientEmail}
              onChange={handleChange}
              required
            />
          </div>

          {/* Type d'abonnement */}
          <div className="form-group">
            <label className="form-label">Type de titre de transport</label>
            <select
              name="type"
              className="form-input"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="ticket_simple">🎫 Ticket Simple (1 voyage)</option>
              <option value="abonnement_limite">🎟️ Abonnement Limité (nombre de voyages)</option>
              <option value="abonnement_illimite">♾️ Abonnement Illimité (période définie)</option>
            </select>
          </div>

          {/* Nombre de voyages (seulement pour abonnement limité) */}
          {formData.type === 'abonnement_limite' && (
            <div className="form-group">
              <label className="form-label">Nombre de voyages autorisés</label>
              <input
                type="number"
                name="voyagesAutorises"
                className="form-input"
                placeholder="ex: 20"
                min="1"
                value={formData.voyagesAutorises}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Dates (pas pour ticket simple) */}
          {formData.type !== 'ticket_simple' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date de début</label>
                <input
                  type="date"
                  name="dateDebut"
                  className="form-input"
                  value={formData.dateDebut}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date d'expiration</label>
                <input
                  type="date"
                  name="dateExpiration"
                  className="form-input"
                  value={formData.dateExpiration}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* Tarif */}
          <div className="form-group">
            <label className="form-label">Tarif (FCFA)</label>
            <input
              type="number"
              name="tarif"
              className="form-input"
              placeholder="ex: 5000"
              min="0"
              value={formData.tarif}
              onChange={handleChange}
              required
            />
          </div>

          {/* Résumé */}
          <div style={{
            background: 'var(--bg-secondary, #0f172a)',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.875rem',
            color: '#64748B',
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#CBD5E1' }}>
              <CreditCard size={14} style={{ marginRight: '0.3rem' }} />
              Résumé
            </p>
            <p style={{ margin: '0.2rem 0' }}>Type : <strong style={{ color: '#CBD5E1' }}>
              {formData.type === 'ticket_simple' ? 'Ticket Simple' :
               formData.type === 'abonnement_limite' ? 'Abonnement Limité' : 'Abonnement Illimité'}
            </strong></p>
            {formData.type === 'abonnement_limite' && formData.voyagesAutorises && (
              <p style={{ margin: '0.2rem 0' }}>Voyages : <strong style={{ color: '#CBD5E1' }}>{formData.voyagesAutorises}</strong></p>
            )}
            {formData.tarif && (
              <p style={{ margin: '0.2rem 0' }}>Tarif : <strong style={{ color: '#02C39A' }}>{parseInt(formData.tarif).toLocaleString()} FCFA</strong></p>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/abonnements')}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Création...' : 'Créer l\'abonnement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NouvelAbonnementPage;