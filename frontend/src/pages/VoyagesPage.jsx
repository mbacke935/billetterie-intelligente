import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import VoyagesTable from '../components/VoyagesTable';
import { getValidations } from '../services/apiBilletterie';
import api from '../services/api';

const PAR_PAGE = 20;

const VoyagesPage = () => {
  const [voyages, setVoyages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultatFilter, setResultatFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVoyages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = { page, limit: PAR_PAGE };
      if (resultatFilter) params.resultat = resultatFilter;
      if (dateFilter) {
        params.date_min = `${dateFilter}T00:00:00.000Z`;
        params.date_max = `${dateFilter}T23:59:59.999Z`;
      }

      let clientsMap = {};
      if (search) {
        const resClients = await api.get('/users', { params: { role: 'client', search } });
        const clientsTrouves = resClients.data.users;
        if (clientsTrouves.length === 0) {
          setVoyages([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }
        clientsMap = Object.fromEntries(clientsTrouves.map((c) => [c._id, c]));
      }

      const { data } = await getValidations(params);
      let rows = data.validations;

      // La recherche par client filtre côté client, le Service Billetterie ne connaissant
      // pas les noms/emails (il ne stocke que des client_id).
      if (search) {
        rows = rows.filter((v) => clientsMap[v.client_id]);
      }

      const idsManquants = [...new Set(rows.map((v) => v.client_id).filter(Boolean))]
        .filter((id) => !clientsMap[id]);
      if (idsManquants.length > 0) {
        const resUsers = await api.get('/users', { params: { ids: idsManquants.join(',') } });
        resUsers.data.users.forEach((u) => { clientsMap[u._id] = u; });
      }

      const mapped = rows.map((v) => {
        const client = clientsMap[v.client_id];
        return {
          id: v.id,
          client: client ? `${client.prenom} ${client.nom}` : (v.client_id ? 'Client inconnu' : '—'),
          typeAbonnement: v.titre?.type_titre || 'N/A',
          dateVoyage: new Date(v.date_validation).toLocaleString('fr-FR'),
          idValidation: `VAL-${String(v.id).slice(0, 8).toUpperCase()}`,
          resultat: v.resultat,
          motifRefus: v.motif_refus,
          agentId: v.agent_id,
        };
      });

      setVoyages(mapped);
      setTotal(search ? mapped.length : data.total);
      setTotalPages(search ? 1 : Math.max(1, data.totalPages));
    } catch (err) {
      setError('Impossible de charger l\'historique des voyages. Vérifiez que le Service Billetterie est démarré.');
    } finally {
      setLoading(false);
    }
  }, [page, resultatFilter, dateFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [resultatFilter, dateFilter, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchVoyages();
    }, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchVoyages]);

  const autorises = voyages.filter((v) => v.resultat === 'autorise').length;
  const refuses = voyages.filter((v) => v.resultat === 'refuse').length;

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historique des voyages</h1>
          <p className="page-subtitle">Suivi de toutes les validations, autorisées et refusées</p>
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

      {/* Stats rapides (sur la page courante) */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total (page)', count: voyages.length, color: '#1C7293' },
          { label: 'Autorisés (page)', count: autorises, color: '#02C39A' },
          { label: 'Refusés (page)', count: refuses, color: '#E53E3E' },
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
            placeholder="Rechercher par client (nom, email)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Résultat :</label>
          <select
            className="filter-select"
            value={resultatFilter}
            onChange={(e) => setResultatFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="autorise">Autorisé</option>
            <option value="refuse">Refusé</option>
          </select>
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
        <>
          <VoyagesTable voyages={voyages} />

          {!search && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Page {page} sur {totalPages} ({total} validation{total > 1 ? 's' : ''})
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

export default VoyagesPage;
