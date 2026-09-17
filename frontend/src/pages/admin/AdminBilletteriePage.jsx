import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ChevronLeft, ChevronRight, Power, PowerOff, Ticket, ShieldAlert, ClipboardList, ArrowRight } from 'lucide-react';
import {
  getStatsBilletterie,
  getTitres,
  activerTitre,
  desactiverTitre,
  getAudit,
} from '../../services/apiBilletterie';

const PAR_PAGE = 15;

const TABS = [
  { key: 'apercu', label: 'Vue d\'ensemble', icon: Ticket },
  { key: 'titres', label: 'Titres', icon: ShieldAlert },
  { key: 'audit', label: 'Journal d\'audit', icon: ClipboardList },
];

// Espace Admin : supervision du Service Billetterie (cf. Prompt D) — indicateurs globaux,
// activation/désactivation manuelle des titres, et consultation du journal d'audit des
// actions sensibles. L'historique complet des validations (tous agents confondus) reste
// sur sa propre page dédiée (/admin/voyages), déjà pourvue de ses filtres avancés.
const AdminBilletteriePage = () => {
  const [tab, setTab] = useState('apercu');

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billetterie & Audit</h1>
          <p className="page-subtitle">Titres actifs/désactivés et piste d'audit des actions sensibles</p>
        </div>
      </div>

      <div className="role-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`role-tab ${tab === t.key ? 'role-tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'apercu' && <VueEnsemble />}
      {tab === 'titres' && <GestionTitres />}
      {tab === 'audit' && <JournalAudit />}
    </div>
  );
};

// ── Vue d'ensemble ──────────────────────────────────────────────────────────
const VueEnsemble = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStatsBilletterie()
      .then((res) => setStats(res.data))
      .catch(() => setError('Service Billetterie momentanément injoignable : impossible de récupérer les indicateurs.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Chargement des indicateurs...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const ind = stats?.indicateurs;
  const cards = [
    { label: 'Titres générés', count: ind?.total_titres ?? 0, color: '#1C7293' },
    { label: 'Titres actifs', count: ind?.titres_actifs ?? 0, color: '#02C39A' },
    { label: 'Titres désactivés', count: (ind?.total_titres ?? 0) - (ind?.titres_actifs ?? 0), color: '#6b7280' },
    { label: 'Validations autorisées', count: ind?.validations_autorisees ?? 0, color: '#38A169' },
    { label: 'Validations refusées', count: ind?.validations_refusees ?? 0, color: '#E53E3E' },
    { label: 'Taux de refus', count: `${ind?.taux_refus_pourcent ?? 0}%`, color: '#DD6B20' },
  ];

  return (
    <>
      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stats-card" style={{ borderLeft: `4px solid ${c.color}` }}>
            <div className="stats-card-content">
              <span className="stats-card-count" style={{ color: c.color }}>{c.count}</span>
              <span className="stats-card-label">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/admin/voyages"
        className="btn btn-secondary"
        style={{ marginTop: '1.5rem', display: 'inline-flex' }}
      >
        Voir l'historique complet des validations <ArrowRight size={16} />
      </Link>
    </>
  );
};

// ── Gestion des titres (activation / désactivation) ─────────────────────────
const GestionTitres = () => {
  const [titres, setTitres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [enCours, setEnCours] = useState(null);

  const fetchTitres = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: PAR_PAGE };
      if (statutFilter) params.statut = statutFilter;
      if (typeFilter) params.type_titre = typeFilter;
      if (search) params.search = search;

      const { data } = await getTitres(params);
      setTitres(data.titres);
      setTotal(data.total);
      setTotalPages(Math.max(1, data.totalPages));
    } catch (err) {
      setError('Impossible de charger les titres de transport.');
    } finally {
      setLoading(false);
    }
  }, [page, statutFilter, typeFilter, search]);

  useEffect(() => { setPage(1); }, [statutFilter, typeFilter, search]);
  useEffect(() => {
    const timeout = setTimeout(fetchTitres, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchTitres]);

  const basculerStatut = async (titre) => {
    setEnCours(titre.id);
    try {
      if (titre.statut === 'actif') {
        await desactiverTitre(titre.id);
      } else {
        await activerTitre(titre.id);
      }
      fetchTitres();
    } catch {
      setError('Action impossible sur ce titre.');
    } finally {
      setEnCours(null);
    }
  };

  return (
    <>
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            className="search-bar-input"
            placeholder="Rechercher par identifiant client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Type :</label>
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tous</option>
            <option value="Ticket simple">Ticket simple</option>
            <option value="Limité">Limité</option>
            <option value="Illimité">Illimité</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Statut :</label>
          <select className="filter-select" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
            <option value="">Tous</option>
            <option value="actif">Actif</option>
            <option value="desactive">Désactivé</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={fetchTitres}>
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Chargement des titres...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Expiration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {titres.length === 0 ? (
                  <tr><td colSpan={6} className="table-empty">Aucun titre trouvé.</td></tr>
                ) : titres.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id.slice(0, 8)}</td>
                    <td>{t.client_id.slice(0, 10)}...</td>
                    <td>{t.type_titre}</td>
                    <td>
                      <span className={`badge ${t.statut === 'actif' ? 'badge-green' : 'badge-red'}`}>
                        {t.statut === 'actif' ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td>{t.date_expiration ? new Date(t.date_expiration).toLocaleDateString('fr-FR') : '—'}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${t.statut === 'actif' ? 'btn-danger' : 'btn-success'}`}
                        disabled={enCours === t.id}
                        onClick={() => basculerStatut(t)}
                      >
                        {t.statut === 'actif' ? <PowerOff size={14} /> : <Power size={14} />}
                        {t.statut === 'actif' ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={16} /> Précédent
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Page {page} sur {totalPages} ({total} titre{total > 1 ? 's' : ''})
              </span>
              <button className="btn btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

// ── Journal d'audit ──────────────────────────────────────────────────────────
const JournalAudit = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [agentId, setAgentId] = useState('');
  const [resultat, setResultat] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAudit = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: PAR_PAGE };
      if (role) params.role = role;
      if (agentId) params.utilisateur_id = agentId;
      if (resultat) params.resultat = resultat;
      if (dateFilter) {
        params.date_min = `${dateFilter}T00:00:00.000Z`;
        params.date_max = `${dateFilter}T23:59:59.999Z`;
      }

      const { data } = await getAudit(params);
      setAudits(data.audits);
      setTotal(data.total);
      setTotalPages(Math.max(1, data.totalPages));
    } catch (err) {
      setError('Impossible de charger le journal d\'audit.');
    } finally {
      setLoading(false);
    }
  }, [page, role, agentId, resultat, dateFilter]);

  useEffect(() => { setPage(1); }, [role, agentId, resultat, dateFilter]);
  useEffect(() => {
    const timeout = setTimeout(fetchAudit, agentId ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchAudit]);

  return (
    <>
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            className="search-bar-input"
            placeholder="Filtrer par identifiant d'agent/admin..."
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Rôle :</label>
          <select className="filter-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Tous</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Résultat :</label>
          <select className="filter-select" value={resultat} onChange={(e) => setResultat(e.target.value)}>
            <option value="">Tous</option>
            <option value="SUCCES">Succès</option>
            <option value="ECHEC">Échec</option>
            <option value="TENTATIVE">Tentative</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Date :</label>
          <input type="date" className="filter-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Chargement du journal d'audit...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date / Heure</th>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Action</th>
                  <th>Ressource</th>
                  <th>Résultat</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 ? (
                  <tr><td colSpan={6} className="table-empty">Aucune entrée d'audit trouvée.</td></tr>
                ) : audits.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.date_heure).toLocaleString('fr-FR')}</td>
                    <td>{a.utilisateur_id?.slice(0, 10)}...</td>
                    <td>{a.role || '—'}</td>
                    <td>{a.type_action}</td>
                    <td>{a.ressource_id ? `${String(a.ressource_id).slice(0, 8)}...` : '—'}</td>
                    <td>
                      <span className={`badge ${a.resultat === 'SUCCES' ? 'badge-green' : a.resultat === 'ECHEC' ? 'badge-red' : 'badge-orange'}`}>
                        {a.resultat}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={16} /> Précédent
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Page {page} sur {totalPages} ({total} entrée{total > 1 ? 's' : ''})
              </span>
              <button className="btn btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default AdminBilletteriePage;
