import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AbonnementCard from '../components/AbonnementCard';

// Données fictives en attendant le backend de MS
const abonnementsFictifs = [
  {
    id: 1,
    client: 'Diop Moussa',
    email: 'moussa.diop@test.com',
    type: 'ticket_simple',
    statut: 'actif',
    dateDebut: '2026-07-01',
    dateExpiration: '2026-07-31',
    voyagesAutorises: 1,
    voyagesConsommes: 0,
    voyagesRestants: 1,
  },
  {
    id: 2,
    client: 'Ndiaye Fatou',
    email: 'fatou.ndiaye@test.com',
    type: 'abonnement_limite',
    statut: 'actif',
    dateDebut: '2026-07-01',
    dateExpiration: '2026-07-31',
    voyagesAutorises: 20,
    voyagesConsommes: 8,
    voyagesRestants: 12,
  },
  {
    id: 3,
    client: 'Ba Ibrahima',
    email: 'ibrahima.ba@test.com',
    type: 'abonnement_illimite',
    statut: 'actif',
    dateDebut: '2026-07-01',
    dateExpiration: '2026-07-31',
    voyagesAutorises: null,
    voyagesConsommes: 15,
    voyagesRestants: null,
  },
  {
    id: 4,
    client: 'Sow Aminata',
    email: 'aminata.sow@test.com',
    type: 'abonnement_limite',
    statut: 'suspendu',
    dateDebut: '2026-06-01',
    dateExpiration: '2026-06-30',
    voyagesAutorises: 10,
    voyagesConsommes: 10,
    voyagesRestants: 0,
  },
  {
    id: 5,
    client: 'Fall Cheikh',
    email: 'cheikh.fall@test.com',
    type: 'abonnement_illimite',
    statut: 'resilié',
    dateDebut: '2026-05-01',
    dateExpiration: '2026-05-31',
    voyagesAutorises: null,
    voyagesConsommes: 22,
    voyagesRestants: null,
  },
];

const AbonnementsPage = () => {
  const navigate = useNavigate();
  const [abonnements, setAbonnements] = useState(abonnementsFictifs);
  const [typeFilter, setTypeFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = abonnements.filter((a) => {
    const matchType = typeFilter ? a.type === typeFilter : true;
    const matchStatut = statutFilter ? a.statut === statutFilter : true;
    const matchSearch = search
      ? a.client.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchType && matchStatut && matchSearch;
  });

  const handleSuspendre = (id) => {
    setAbonnements((prev) =>
      prev.map((a) => a.id === id ? { ...a, statut: 'suspendu' } : a)
    );
  };

  const handleResilier = (id) => {
    setAbonnements((prev) =>
      prev.map((a) => a.id === id ? { ...a, statut: 'resilié' } : a)
    );
  };

  const handleRenouveler = (id) => {
    setAbonnements((prev) =>
      prev.map((a) => a.id === id ? { ...a, statut: 'actif' } : a)
    );
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Abonnements</h1>
          <p className="page-subtitle">Gestion des abonnements et tickets</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setAbonnements(abonnementsFictifs)}
          >
            <RefreshCw size={16} /> Actualiser
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/abonnements/nouveau')}
          >
            <Plus size={16} /> Nouvel abonnement
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            className="search-bar-input"
            placeholder="Rechercher par client ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Type :</label>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="ticket_simple">Ticket Simple</option>
            <option value="abonnement_limite">Abonnement Limité</option>
            <option value="abonnement_illimite">Abonnement Illimité</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Statut :</label>
          <select
            className="filter-select"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
            <option value="resilié">Résilié</option>
          </select>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', count: abonnements.length, color: '#1C7293' },
          { label: 'Actifs', count: abonnements.filter(a => a.statut === 'actif').length, color: '#38A169' },
          { label: 'Suspendus', count: abonnements.filter(a => a.statut === 'suspendu').length, color: '#DD6B20' },
          { label: 'Résiliés', count: abonnements.filter(a => a.statut === 'resilié').length, color: '#E53E3E' },
        ].map((s) => (
          <div key={s.label} className="stats-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="stats-card-content">
              <span className="stats-card-count" style={{ color: s.color }}>{s.count}</span>
              <span className="stats-card-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
          Aucun abonnement trouvé.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map((abonnement) => (
            <AbonnementCard
              key={abonnement.id}
              abonnement={abonnement}
              onSuspendre={handleSuspendre}
              onResilier={handleResilier}
              onRenouveler={handleRenouveler}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AbonnementsPage;