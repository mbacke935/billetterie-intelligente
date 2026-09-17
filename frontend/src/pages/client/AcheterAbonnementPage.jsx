import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Check, Ticket, Repeat, Infinity as InfinityIcon, Minus, Plus } from 'lucide-react';
import { getTypesAbonnements, creerAbonnement } from '../../services/apiAbonnements';
import { genererTitre } from '../../services/apiBilletterie';

const iconParFormule = {
  'Ticket simple': Ticket,
  'Limité': Repeat,
  'Illimité': InfinityIcon,
};

const MAX_VOYAGES_PERSONNALISES = 500;

// Espace Client : souscription en libre-service à une formule (cf. Prompt B, "Acheter /
// S'abonner"). Pour la formule "Limité", le client choisit lui-même le nombre de voyages
// qu'il souhaite (comme l'admin peut le faire pour lui via NouvelAbonnementPage) ; le tarif
// affiché est alors recalculé au prorata du prix unitaire de la formule.
const AcheterAbonnementPage = () => {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [achatEnCours, setAchatEnCours] = useState(null);
  const [voyagesParType, setVoyagesParType] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getTypesAbonnements()
      .then((res) => {
        const typesActifs = res.data.filter((t) => t.actif !== false);
        setTypes(typesActifs);
        // Initialise le nombre de voyages personnalisé à la valeur par défaut de chaque formule "Limité"
        const initial = {};
        typesActifs.forEach((t) => {
          if (t.nom === 'Limité') {
            initial[t.id] = String(t.voyages_initiaux || 1);
          }
        });
        setVoyagesParType(initial);
      })
      .catch(() => setError('Impossible de charger les formules disponibles. Vérifiez que le Service Abonnements est démarré.'))
      .finally(() => setLoadingData(false));
  }, []);

  const ajusterVoyages = (typeId, delta) => {
    setVoyagesParType((prev) => {
      const actuel = parseInt(prev[typeId]) || 1;
      const suivant = Math.min(MAX_VOYAGES_PERSONNALISES, Math.max(1, actuel + delta));
      return { ...prev, [typeId]: String(suivant) };
    });
  };

  const prixAffiche = (type) => {
    if (type.nom !== 'Limité') return type.tarif;
    const voyagesParDefaut = type.voyages_initiaux || 1;
    const prixParVoyage = type.tarif / voyagesParDefaut;
    const voyagesChoisis = parseInt(voyagesParType[type.id]) || voyagesParDefaut;
    return Math.round(prixParVoyage * voyagesChoisis);
  };

  const handleSouscrire = async (type) => {
    setAchatEnCours(type.id);
    setError('');
    setSuccess('');
    try {
      const payload = { type_abonnement_id: type.id };
      if (type.nom === 'Limité') {
        const voyages = parseInt(voyagesParType[type.id]) || type.voyages_initiaux || 1;
        payload.voyages_personnalises = voyages;
      }
      const { data: abonnement } = await creerAbonnement(payload);

      try {
        await genererTitre({ abonnement_id: abonnement.id });
      } catch (errTitre) {
        setError(errTitre.response?.data?.message || 'Abonnement créé, mais la génération du QR Code a échoué. Contactez un agent.');
        return;
      }

      setSuccess(`Souscription à la formule « ${type.nom} » réussie !`);
      setTimeout(() => navigate(`/client/titres/${abonnement.id}/qrcode`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la souscription.');
    } finally {
      setAchatEnCours(null);
    }
  };

  if (loadingData) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Chargement des formules...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Acheter / S'abonner</h1>
          <p className="page-subtitle">Choisissez la formule qui correspond à vos déplacements</p>
        </div>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
      }}>
        {types.map((type) => {
          const Icon = iconParFormule[type.nom] || CreditCard;
          return (
            <div key={type.id} className="ticket-card" style={{ padding: '1.75rem 1.5rem', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{type.nom}</h3>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>
                {prixAffiche(type)} FCFA
                {type.nom === 'Limité' && (
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    ({Math.round(type.tarif / (type.voyages_initiaux || 1))} FCFA/voyage)
                  </span>
                )}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                  <Check size={14} color="var(--success)" /> Valable {type.duree_validite} jour(s)
                </li>
                {type.nom !== 'Limité' && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                    <Check size={14} color="var(--success)" />
                    {type.voyages_initiaux ? `${type.voyages_initiaux} voyage(s)` : 'Voyages illimités'}
                  </li>
                )}
              </ul>

              {/* Nombre de voyages personnalisé — uniquement pour la formule "Limité" */}
              {type.nom === 'Limité' && (
                <div className="voyages-stepper">
                  <button
                    type="button"
                    className="voyages-stepper-btn"
                    onClick={() => ajusterVoyages(type.id, -1)}
                    aria-label="Diminuer le nombre de voyages"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="voyages-stepper-value">
                    <Repeat size={16} className="voyages-stepper-icon" />
                    <input
                      type="number"
                      min="1"
                      max={MAX_VOYAGES_PERSONNALISES}
                      className="voyages-stepper-input"
                      value={voyagesParType[type.id] ?? ''}
                      onChange={(e) => setVoyagesParType((prev) => ({ ...prev, [type.id]: e.target.value }))}
                    />
                    <span>voyage(s)</span>
                  </div>
                  <button
                    type="button"
                    className="voyages-stepper-btn"
                    onClick={() => ajusterVoyages(type.id, 1)}
                    aria-label="Augmenter le nombre de voyages"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}

              <button
                className="btn btn-primary btn-block"
                disabled={achatEnCours === type.id}
                onClick={() => handleSouscrire(type)}
              >
                {achatEnCours === type.id ? 'Souscription...' : 'Souscrire'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AcheterAbonnementPage;
