import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Check, Ticket, Repeat, Infinity as InfinityIcon } from 'lucide-react';
import { getTypesAbonnements, creerAbonnement } from '../../services/apiAbonnements';
import { genererTitre } from '../../services/apiBilletterie';

const iconParFormule = {
  'Ticket simple': Ticket,
  'Limité': Repeat,
  'Illimité': InfinityIcon,
};

// Espace Client : souscription en libre-service à une formule (cf. Prompt B, "Acheter /
// S'abonner"). Contrairement à NouvelAbonnementPage (outil d'attribution de l'Admin, qui
// choisit le client ET personnalise le nombre de voyages), un client ne souscrit que pour
// lui-même et reçoit toujours les valeurs par défaut de la formule choisie.
const AcheterAbonnementPage = () => {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [achatEnCours, setAchatEnCours] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getTypesAbonnements()
      .then((res) => setTypes(res.data.filter((t) => t.actif !== false)))
      .catch(() => setError('Impossible de charger les formules disponibles. Vérifiez que le Service Abonnements est démarré.'))
      .finally(() => setLoadingData(false));
  }, []);

  const handleSouscrire = async (type) => {
    setAchatEnCours(type.id);
    setError('');
    setSuccess('');
    try {
      const { data: abonnement } = await creerAbonnement({ type_abonnement_id: type.id });

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
                {type.tarif} FCFA
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                  <Check size={14} color="var(--success)" /> Valable {type.duree_validite} jour(s)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                  <Check size={14} color="var(--success)" />
                  {type.voyages_initiaux ? `${type.voyages_initiaux} voyage(s)` : 'Voyages illimités'}
                </li>
              </ul>
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
