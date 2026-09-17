import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AbonnementCard from '../components/AbonnementCard';
import {
  getAllAbonnements,
  getTypesAbonnements,
  getStatsAbonnements,
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
const statutMapInverse = Object.fromEntries(
  Object.entries(statutMap).map(([backend, frontend]) => [frontend, backend])
);

// Mapper les noms de types vers les clés frontend
const typeMap = {
  'Ticket simple': 'ticket_simple',
  'Limité': 'abonnement_limite',
  'Illimité': 'abonnement_illimite',
};

const TICKETS_PAR_PAGE = 12;

const AbonnementsPage = () => {
  const navigate = useNavigate();
  const [abonnements, setAbonnements] = useState([]);
  const [types, setTypes] = useState([]);
  const [statsGlobal, setStatsGlobal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // La pagination est gérée côté serveur par le service abonnements (page/limit),
  // qui ignore tout ce qui touche aux clients : on résout donc la recherche texte
  // en identifiants clients via le Service Utilisateurs, puis on croise les deux.
  const fetchAbonnements = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = { page, limit: TICKETS_PAR_PAGE };

      if (statutFilter && statutMapInverse[statutFilter]) {
        params.statut = statutMapInverse[statutFilter];
      }

      if (typeFilter) {
        const idsCorrespondants = types
          .filter((t) => typeMap[t.nom] === typeFilter)
          .map((t) => t.id);
        if (idsCorrespondants.length === 0) {
          setAbonnements([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }
        params.type_abonnement_id = idsCorrespondants.join(',');
      }

      let clientsMap = {};
      if (search) {
        const resClients = await api.get('/users', { params: { role: 'client', search } });
        const clientsTrouves = resClients.data.users;
        if (clientsTrouves.length === 0) {
          setAbonnements([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }
        params.user_ids = clientsTrouves.map((c) => c._id).join(',');
        clientsMap = Object.fromEntries(clientsTrouves.map((c) => [c._id, c]));
      }

      const res = await getAllAbonnements(params);
      const { total: totalCount, totalPages: totalPagesRes, abonnements: rows } = res.data;

      // Compléter les infos client manquantes (hors cas de la recherche, déjà résolue ci-dessus)
      const idsManquants = [...new Set(rows.map((a) => a.user_id))].filter((id) => !clientsMap[id]);
      if (idsManquants.length > 0) {
        const resUsers = await api.get('/users', { params: { ids: idsManquants.join(',') } });
        resUsers.data.users.forEach((u) => { clientsMap[u._id] = u; });
      }

      const mapped = rows.map((a) => {
        const client = clientsMap[a.user_id];
        return {
          id: a.id,
          client: client ? `${client.prenom} ${client.nom}` : 'Client inconnu',
          email: client?.email || '—',
          type: typeMap[a.typeAbonnement?.nom] || 'ticket_simple',
          statut: statutMap[a.statut] || 'actif',
          dateDebut: a.date_debut,
          dateExpiration: a.date_expiration,
          // Le nombre de voyages autorisés est propre à cet abonnement (il peut avoir été
          // personnalisé à l'attribution) : on le déduit du solde réel plutôt que de la
          // valeur par défaut de la formule.
          voyagesAutorises: a.voyages_restants === -1 ? null : a.voyages_consommes + a.voyages_restants,
          voyagesConsommes: a.voyages_consommes,
          voyagesRestants: a.voyages_restants === -1 ? null : a.voyages_restants,
        };
      });

      setAbonnements(mapped);
      setTotal(totalCount);
      setTotalPages(Math.max(1, totalPagesRes));
    } catch (err) {
      setError('Impossible de charger les abonnements. Vérifiez que le service abonnements est démarré sur le port 5001.');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statutFilter, search, types]);

  const fetchStats = async () => {
    try {
      const res = await getStatsAbonnements();
      setStatsGlobal(res.data);
    } catch {
      // Statistiques secondaires : on n'affiche pas d'erreur bloquante si indisponibles.
    }
  };

  useEffect(() => {
    getTypesAbonnements().then((res) => setTypes(res.data)).catch(() => {});
    fetchStats();
  }, []);

  // Revenir à la première page à chaque changement de filtre/recherche,
  // pour éviter de rester sur une page hors bornes.
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statutFilter, search]);

  // Requête serveur à chaque changement de page/filtre, avec un léger debounce
  // sur la recherche pour éviter une requête par frappe clavier.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAbonnements();
    }, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchAbonnements]);

  const refresh = () => {
    fetchAbonnements();
    fetchStats();
  };

  const handleSuspendre = async (id) => {
    try {
      await suspendreAbonnement(id);
      refresh();
    } catch (err) {
      console.error('Erreur suspension:', err);
    }
  };

  const handleResilier = async (id) => {
    try {
      await resilierAbonnement(id);
      refresh();
    } catch (err) {
      console.error('Erreur résiliation:', err);
    }
  };

  const handleRenouveler = async (id) => {
    try {
      await renouvelerAbonnement(id);
      refresh();
    } catch (err) {
      console.error('Erreur renouvellement:', err);
    }
  };

  const compterParStatut = (statutBackend) => {
    const entree = statsGlobal?.repartition_par_statut?.find((s) => s.statut === statutBackend);
    return entree ? Number(entree.total) : 0;
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Abonnements</h1>
          <p className="page-subtitle">Gestion des abonnements et tickets</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refresh}>
            <RefreshCw size={16} /> Actualiser
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/abonnements/nouveau')}
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
            <option value="resilié">Résilié / Annulé</option>
          </select>
        </div>
      </div>

      {/* Stats rapides (indicateurs globaux, indépendants de la pagination) */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', count: statsGlobal?.indicateurs?.total_abonnements ?? 0, color: '#1C7293' },
          { label: 'Actifs', count: compterParStatut('Actif'), color: '#38A169' },
          { label: 'Suspendus', count: compterParStatut('Suspendu'), color: '#DD6B20' },
          { label: 'Résiliés / Annulés', count: compterParStatut('Résilie'), color: '#E53E3E' },
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
      ) : abonnements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Aucun abonnement trouvé.
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.9rem',
          }}>
            {abonnements.map((abonnement) => (
              <AbonnementCard
                key={abonnement.id}
                abonnement={abonnement}
                onSuspendre={handleSuspendre}
                onResilier={handleResilier}
                onRenouveler={handleRenouveler}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1.5rem',
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Page {page} sur {totalPages} ({total} ticket{total > 1 ? 's' : ''})
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AbonnementsPage;
