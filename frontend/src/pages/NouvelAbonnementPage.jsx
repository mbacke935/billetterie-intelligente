import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Save } from 'lucide-react';
import { getTypesAbonnements, creerAbonnement } from '../services/apiAbonnements';
import api from '../services/api';

const NouvelAbonnementPage = () => {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '',
    type_abonnement_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Types d'abonnements depuis le service abonnements (port 5001)
        const typesRes = await getTypesAbonnements();
        setTypes(typesRes.data);

        // Clients actifs depuis le service utilisateurs (port 5000)
        const clientsRes = await api.get('/users', { params: { role: 'client', statut: 'actif' } });
        setClients(clientsRes.data.users);
      } catch (err) {
        setError('Erreur lors du chargement des données. Vérifiez que les deux services sont démarrés.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await creerAbonnement({
        user_id: formData.user_id,
        type_abonnement_id: parseInt(formData.type_abonnement_id),
      });
      setSuccess('Abonnement créé avec succès !');
      setTimeout(() => navigate('/abonnements'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  const typeSelectionne = types.find(t => t.id === parseInt(formData.type_abonnement_id));

  if (loadingData) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

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
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          background: 'var(--bg-card, #1e293b)',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>

          {/* Sélection du client */}
          <div className="form-group">
            <label className="form-label">Client</label>
            <select
              name="user_id"
              className="form-input"
              value={formData.user_id}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un client...</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.prenom} {c.nom} — {c.email}
                </option>
              ))}
            </select>
          </div>

          {/* Type d'abonnement */}
          <div className="form-group">
            <label className="form-label">Type de titre de transport</label>
            <select
              name="type_abonnement_id"
              className="form-input"
              value={formData.type_abonnement_id}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un type...</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom} — {t.tarif} € — {t.duree_validite} jour(s)
                  {t.voyages_initiaux ? ` — ${t.voyages_initiaux} voyage(s)` : ' — Illimité'}
                </option>
              ))}
            </select>
          </div>

          {/* Résumé */}
          {typeSelectionne && (
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
              <p style={{ margin: '0.2rem 0' }}>
                Type : <strong style={{ color: '#CBD5E1' }}>{typeSelectionne.nom}</strong>
              </p>
              <p style={{ margin: '0.2rem 0' }}>
                Durée : <strong style={{ color: '#CBD5E1' }}>{typeSelectionne.duree_validite} jour(s)</strong>
              </p>
              <p style={{ margin: '0.2rem 0' }}>
                Voyages : <strong style={{ color: '#CBD5E1' }}>
                  {typeSelectionne.voyages_initiaux ? typeSelectionne.voyages_initiaux : 'Illimité'}
                </strong>
              </p>
              <p style={{ margin: '0.2rem 0' }}>
                Tarif : <strong style={{ color: '#02C39A' }}>{typeSelectionne.tarif} €</strong>
              </p>
            </div>
          )}

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