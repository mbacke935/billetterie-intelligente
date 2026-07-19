import { useState } from 'react';
import { RefreshCw, MapPin } from 'lucide-react';
import VoyagesTable from '../components/VoyagesTable';

// Données fictives en attendant le backend de MS
const voyagesFictifs = [
  {
    id: 1,
    client: 'Diop Moussa',
    typeAbonnement: 'Abonnement Limité',
    dateVoyage: '2026-07-19 08:32',
    idValidation: 'VAL-001',
  },
  {
    id: 2,
    client: 'Ndiaye Fatou',
    typeAbonnement: 'Abonnement Illimité',
    dateVoyage: '2026-07-19 09:15',
    idValidation: 'VAL-002',
  },
  {
    id: 3,
    client: 'Ba Ibrahima',
    typeAbonnement: 'Ticket Simple',
    dateVoyage: '2026-07-19 10:05',
    idValidation: 'VAL-003',
  },
  {
    id: 4,
    client: 'Diop Moussa',
    typeAbonnement: 'Abonnement Limité',
    dateVoyage: '2026-07-18 17:45',
    idValidation: 'VAL-004',
  },
  {
    id: 5,
    client: 'Ndiaye Fatou',
    typeAbonnement: 'Abonnement Illimité',
    dateVoyage: '2026-07-18 08:22',
    idValidation: 'VAL-005',
  },
];

const VoyagesPage = () => {
  const [voyages] = useState(voyagesFictifs);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = voyages.filter((v) => {
    const matchSearch = search
      ? v.client.toLowerCase().includes(search.toLowerCase()) ||
        v.idValidation.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchDate = dateFilter
      ? v.dateVoyage.startsWith(dateFilter)
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
          <button className="btn btn-secondary">
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total voyages', count: voyages.length, color: '#1C7293' },
          { label: 'Aujourd\'hui', count: voyages.filter(v => v.dateVoyage.startsWith('2026-07-19')).length, color: '#02C39A' },
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
          <MapPin size={18} className="search-bar-icon" />
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
      <VoyagesTable voyages={filtered} />
    </div>
  );
};

export default VoyagesPage;