import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Save, Minus, Plus, Repeat } from 'lucide-react';
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
  const [voyagesPersonnalises, setVoyagesPersonnalises] = useState('');
  const [clientSearch, setClientSearch] = useState('');
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // À chaque changement de formule, réinitialiser le nombre de voyages
    // personnalisé sur la valeur par défaut de la nouvelle formule sélectionnée.
    if (name === 'type_abonnement_id') {
      const nouveauType = types.find((t) => t.id === parseInt(value));
      setVoyagesPersonnalises(
        nouveauType?.nom === 'Limité' ? String(nouveauType.voyages_initiaux || 1) : ''
      );
    }
  };

  const ajusterVoyages = (delta) => {
    setVoyagesPersonnalises((prev) => {
      const actuel = parseInt(prev) || 0;
      return String(Math.max(1, actuel + delta));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        user_id: formData.user_id,
        type_abonnement_id: parseInt(formData.type_abonnement_id),
      };

      if (typeSelectionne?.nom === 'Limité' && voyagesPersonnalises) {
        payload.voyages_personnalises = parseInt(voyagesPersonnalises);
      }

      await creerAbonnement(payload);
      setSuccess('Abonnement créé avec succès !');
      setTimeout(() => navigate('/abonnements'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  const typeSelectionne = types.find(t => t.id === parseInt(formData.type_abonnement_id));

  // Le tarif affiché suit le nombre de voyages : pour une formule "Limité" personnalisée,
  // on calcule un prix proportionnel au nombre de voyages choisi plutôt que d'afficher
  // le tarif fixe de la formule par défaut, qui devenait incohérent une fois le nombre
  // de voyages modifié via le stepper.
  const prixAffiche = (() => {
    if (!typeSelectionne) return 0;
    if (typeSelectionne.nom !== 'Limité') return typeSelectionne.tarif;

    const voyagesParDefaut = typeSelectionne.voyages_initiaux || 1;
    const prixParVoyage = typeSelectionne.tarif / voyagesParDefaut;
    const voyagesChoisis = parseInt(voyagesPersonnalises) || voyagesParDefaut;
    return Math.round(prixParVoyage * voyagesChoisis);
  })();

  // Filtre les clients affichés dans la liste déroulante par nom/prénom/email,
  // en gardant toujours visible le client déjà sélectionné même s'il ne matche plus la recherche.
  const clientsFiltres = clients.filter((c) => {
    if (c._id === formData.user_id) return true;
    if (!clientSearch) return true;
    const s = clientSearch.toLowerCase();
    return (
      c.nom.toLowerCase().includes(s) ||
      c.prenom.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s)
    );
  });

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
            <label className="form-label">Client<span className="required-mark">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher un client par nom, prénom ou email..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              style={{ marginBottom: '0.5rem' }}
            />
            <select
              name="user_id"
              className="form-input"
              value={formData.user_id}
              onChange={handleChange}
              required
            >
              <option value="">
                {clientsFiltres.length === 0 ? 'Aucun client trouvé' : 'Sélectionner un client...'}
              </option>
              {clientsFiltres.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.prenom} {c.nom} — {c.email}
                </option>
              ))}
            </select>
          </div>

          {/* Type d'abonnement */}
          <div className="form-group">
            <label className="form-label">Type de titre de transport<span className="required-mark">*</span></label>
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
                  {t.nom} — {t.tarif} FCFA — {t.duree_validite} jour(s)
                  {t.voyages_initiaux ? ` — ${t.voyages_initiaux} voyage(s)` : ' — Illimité'}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre de voyages personnalisé — uniquement pour la formule "Limité" */}
          {typeSelectionne?.nom === 'Limité' && (
            <div className="form-group">
              <label className="form-label">
                Nombre de voyages pour cet abonnement<span className="required-mark">*</span>
              </label>
              <div className="voyages-stepper">
                <button
                  type="button"
                  className="voyages-stepper-btn"
                  onClick={() => ajusterVoyages(-1)}
                  aria-label="Diminuer le nombre de voyages"
                >
                  <Minus size={16} />
                </button>
                <div className="voyages-stepper-value">
                  <Repeat size={16} className="voyages-stepper-icon" />
                  <input
                    type="number"
                    min="1"
                    className="voyages-stepper-input"
                    value={voyagesPersonnalises}
                    onChange={(e) => setVoyagesPersonnalises(e.target.value)}
                    required
                  />
                  <span>voyage(s)</span>
                </div>
                <button
                  type="button"
                  className="voyages-stepper-btn"
                  onClick={() => ajusterVoyages(1)}
                  aria-label="Augmenter le nombre de voyages"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="voyages-stepper-hint">
                Par défaut, la formule « {typeSelectionne.nom} » accorde {typeSelectionne.voyages_initiaux || 1} voyage(s).
                Vous pouvez personnaliser ce nombre pour ce client uniquement.
              </p>
            </div>
          )}

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
                  {typeSelectionne.nom === 'Illimité'
                    ? 'Illimité'
                    : (parseInt(voyagesPersonnalises) || typeSelectionne.voyages_initiaux || 0)}
                </strong>
              </p>
              <p style={{ margin: '0.2rem 0' }}>
                Tarif : <strong style={{ color: '#02C39A' }}>{prixAffiche} FCFA</strong>
                {typeSelectionne.nom === 'Limité' && (
                  <span style={{ color: 'var(--text-muted, #64748B)' }}>
                    {' '}({Math.round(typeSelectionne.tarif / (typeSelectionne.voyages_initiaux || 1))} FCFA/voyage)
                  </span>
                )}
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