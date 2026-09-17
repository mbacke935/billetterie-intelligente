import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VoyagesTable from '../../components/VoyagesTable';
import { getValidationsParClient } from '../../services/apiBilletterie';

// Espace Client : historique des propres déplacements du passager connecté (cf. Prompt B).
const HistoriqueVoyagesPage = () => {
  const { user } = useAuth();
  const [voyages, setVoyages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistorique = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: rows } = await getValidationsParClient(user.id);
      const mapped = rows.map((v) => ({
        id: v.id,
        client: '—',
        typeAbonnement: v.titre?.type_titre || 'N/A',
        dateVoyage: new Date(v.date_validation).toLocaleString('fr-FR'),
        idValidation: `VAL-${String(v.id).slice(0, 8).toUpperCase()}`,
        resultat: v.resultat,
        motifRefus: v.motif_refus,
      }));
      setVoyages(mapped);
    } catch (err) {
      setError('Impossible de charger votre historique de déplacements. Vérifiez que le Service Billetterie est démarré.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistorique();
  }, [fetchHistorique]);

  const autorises = voyages.filter((v) => v.resultat === 'autorise').length;
  const refuses = voyages.filter((v) => v.resultat === 'refuse').length;

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes déplacements</h1>
          <p className="page-subtitle">Historique de vos voyages validés par les agents</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchHistorique}>
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', count: voyages.length, color: '#1C7293' },
          { label: 'Autorisés', count: autorises, color: '#02C39A' },
          { label: 'Refusés', count: refuses, color: '#E53E3E' },
        ].map((s) => (
          <div key={s.label} className="stats-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="stats-card-content">
              <span className="stats-card-count" style={{ color: s.color }}>{s.count}</span>
              <span className="stats-card-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Chargement de votre historique...</p>
        </div>
      ) : (
        <VoyagesTable voyages={voyages} />
      )}
    </div>
  );
};

export default HistoriqueVoyagesPage;
