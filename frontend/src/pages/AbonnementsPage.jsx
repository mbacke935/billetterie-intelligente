import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AbonnementCard from '../components/AbonnementCard';
import {
  getAbonnementsByUser,
  suspendreAbonnement,
  resilierAbonnement,
  renouvelerAbonnement,
} from '../services/apiAbonnements';
import api from '../services/api';

// Mapper les statuts du backend vers le frontend
const statutMap = {
  'Actif': 'actif',
  'Suspendu': 'suspendu',
  'Résilie': 'resilié',
};

// Mapper les noms de types vers les clés frontend
const typeMap = {
  'Ticket simple': 'ticket_simple',
  'Limité': 'abonnement_limite',
  'Illimité': 'abonnement_illimite',
};

const AbonnementsPage = () => {
  const navigate = useNavigate();
  const [abonnements, setAbonnements] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchClients = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'client' } });
      return res.data.users;
    } catch {
      return [];
    }
  };

  const fetchAbonnements = async () => {
    try {
      setLoading(true);
      setError('');

      // Récupérer tous les clients
      const clientsList = await fetchClients();
      setClients(clientsList);

      // Récupérer les abonnements de chaque client
      const allAbonnements = [];
      for (const client of clientsList) {
        try {
          const res = await getAbonnementsByUser(client._id);
          const abonnementsClient = res.data.map((a) => ({
            id: a.id,
            client: `${client.prenom} ${client.nom}`,
            email: client.email,
            type: typeMap[a.typeAbonnement?.nom] || 'ticket_simple',
            statut: statutMap[a.statut] || 'actif',
            dateDebut: a.date_debut?.split('T')[0],
            dateExpiration: a.date_expiration?.split('T')[0],
            voyagesAutorises: a.typeAbonnement?.voyages_initiaux,
            voyagesConsommes: a.voyages_consommes,
            voyagesRestants: a.voyages_restants === -1 ? null : a.voyages_restants,
          }));
          allAbonnements.push(...abonnementsClient);
        } catch {
          // Ce client n'a pas d'abonnement, on continue
        }
      }
      setAbonnements(allAbonnements);
    } catch (err) {
      setError('Impossible de charger les abonnements. Vérifiez que le service abonnements est démarré sur le port 5001.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbonnements();
  }, []);

  const filtered = abonnements.filter((a) => {
    const matchType = typeFilter ? a.type === typeFilter : true;
    const matchStatut = statutFilter ? a.statut === statutFilter : true;
    const matchSearch = search
      ? a.client.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchType && matchStatut && matchSearch;
  });

  const handleSuspendre = async (id) => {
    try {
      await suspendreAbonnement(id);
      fetchAbonnements();
    } catch (err) {
      console.error('Erreur suspension:', err);
    }
  };

  const handleResilier = async (id) => {
    try {
      await resilierAbonnement(id);
      fetchAbonnements();
    } catch (err) {
      console.error('Erreur résiliation:', err);
    }
  };

  const handleRenouveler = async (id) => {
    try {
      await renouvelerAbonnement(id);
      fetchAbonnements();
    } catch (err) {
      console.error('Erreur renouvellement:', err);
    }
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Abonnements</h1>
          <p className="page-subtitle">Gestion des abonnements et tickets</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchAbonnements}>
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

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

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
      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Chargement des abonnements...</p>
        </div>
      ) : filtered.length === 0 ? (
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