import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import VoyagesTable from '../components/VoyagesTable';
import { getVoyagesByUser } from '../services/apiAbonnements';
import api from '../services/api';

const VoyagesPage = () => {
  const [voyages, setVoyages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState('');

  const fetchVoyages = async () => {
    try {
      setLoading(true);
      setError('');

      // Récupérer tous les clients
      const clientsRes = await api.get('/users', { params: { role: 'client' } });
      const clients = clientsRes.data.users;

      // Récupérer les voyages de chaque client
      const allVoyages = [];
      for (const client of clients) {
        try {
          const res = await getVoyagesByUser(client._id);
          const voyagesClient = res.data.map((v) => ({
            id: v.id,
            client: `${client.prenom} ${client.nom}`,
            typeAbonnement: v.abonnement?.typeAbonnement?.nom || 'N/A',
            dateVoyage: new Date(v.date_consommation).toLocaleString('fr-FR'),
            idValidation: `VAL-${String(v.id).padStart(3, '0')}`,
          }));
          allVoyages.push(...voyagesClient);
        } catch {
          // Ce client n'a pas de voyages
        }
      }

      // Trier par date décroissante
      allVoyages.sort((a, b) => new Date(b.dateVoyage) - new Date(a.dateVoyage));
      setVoyages(allVoyages);
    } catch (err) {
      setError('Impossible de charger les voyages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoyages();
  }, []);

  const filtered = voyages.filter((v) => {
    const matchSearch = search
      ? v.client.toLowerCase().includes(search.toLowerCase()) ||
        v.idValidation.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchDate = dateFilter
      ? v.dateVoyage.includes(dateFilter)
      : true;
    return matchSearch && matchDate;
  });

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historique des voyages</h1>
          <p className="page-subtitle">Suivi de toutes les validations de voyage</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchVoyages}>
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Stats rapides */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total voyages', count: voyages.length, color: '#1C7293' },
          { label: 'Aujourd\'hui', count: voyages.filter(v => v.dateVoyage.includes(new Date().toLocaleDateString('fr-FR'))).length, color: '#02C39A' },
          { label: 'Cette semaine', count: voyages.length, color: '#21295C' },
        ].map((s) => (
          <div key={s.label} className="stats-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="stats-card-content">
              <span className="stats-card-count" style={{ color: s.color }}>{s.count}</span>
              <span className="stats-card-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            className="search-bar-input"
            placeholder="Rechercher par client ou ID validation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Date :</label>
          <input
            type="date"
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Chargement des voyages...</p>
        </div>
      ) : (
        <VoyagesTable voyages={filtered} />
      )}
    </div>
  );
};

export default VoyagesPage;