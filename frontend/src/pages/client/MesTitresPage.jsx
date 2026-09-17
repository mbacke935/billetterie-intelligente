import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AbonnementCard from '../../components/AbonnementCard';
import { getAbonnementsByUser } from '../../services/apiAbonnements';

// Mêmes correspondances backend → frontend que l'espace Admin (AbonnementsPage), reprises
// ici pour ne pas coupler les deux pages entre elles.
const statutMap = {
  'Actif': 'actif',
  'Suspendu': 'suspendu',
  'Résilie': 'resilié',
};

const typeMap = {
  'Ticket simple': 'ticket_simple',
  'Limité': 'abonnement_limite',
  'Illimité': 'abonnement_illimite',
};

// Espace Client : liste des titres de transport / abonnements du passager connecté, avec
// leur QR Code (cf. Prompt B). Aucune action de gestion (suspendre/résilier/renouveler) —
// un client consulte ses titres, il ne les administre pas.
const MesTitresPage = () => {
  const { user } = useAuth();
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMesTitres = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: rows } = await getAbonnementsByUser(user.id);

      const mapped = rows.map((a) => ({
        id: a.id,
        client: `${user.prenom} ${user.nom}`,
        email: user.email,
        type: typeMap[a.typeAbonnement?.nom] || 'ticket_simple',
        statut: statutMap[a.statut] || 'actif',
        dateDebut: a.date_debut,
        dateExpiration: a.date_expiration,
        voyagesAutorises: a.voyages_restants === -1 ? null : a.voyages_consommes + a.voyages_restants,
        voyagesConsommes: a.voyages_consommes,
        voyagesRestants: a.voyages_restants === -1 ? null : a.voyages_restants,
      }));

      // Les titres les plus récents (et donc les plus pertinents à présenter) en premier.
      mapped.sort((x, y) => new Date(y.dateDebut) - new Date(x.dateDebut));
      setAbonnements(mapped);
    } catch (err) {
      setError('Impossible de charger vos titres de transport. Vérifiez que le Service Abonnements est démarré.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMesTitres();
  }, [fetchMesTitres]);

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes titres de transport</h1>
          <p className="page-subtitle">Présentez le QR Code à l'agent lors de votre voyage</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchMesTitres}>
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Chargement de vos titres...</p>
        </div>
      ) : abonnements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Vous n'avez encore aucun titre de transport. Rendez-vous dans « Acheter / S'abonner » pour en obtenir un.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.9rem',
        }}>
          {abonnements.map((abonnement) => (
            <AbonnementCard
              key={abonnement.id}
              abonnement={abonnement}
              qrBasePath="/client/titres"
              readOnly
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MesTitresPage;
