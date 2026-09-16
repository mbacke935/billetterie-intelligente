import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import UserTable from '../components/UserTable';
import UserForm from '../components/UserForm';
import ImportCSV from '../components/ImportCSV';
import { Plus, Upload, RefreshCw, Users, ShieldCheck, UserCog, Trash2 } from 'lucide-react';

const ROLE_TABS = [
  { value: '', label: 'Tous', icon: Users },
  { value: 'admin', label: 'Administrateurs', icon: ShieldCheck },
  { value: 'agent', label: 'Agents', icon: UserCog },
  { value: 'client', label: 'Clients', icon: Users },
];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Le rôle, le statut et la recherche sont tous délégués au backend via des
  // query params : la liste regroupe tous les utilisateurs et se filtre par rôle
  // (onglets) plutôt que d'avoir une page distincte par rôle.
  const fetchUsers = useCallback(async (role, statut, recherche) => {
    try {
      setLoading(true);
      const params = {};
      if (role) params.role = role;
      if (statut) params.statut = statut;
      if (recherche) params.search = recherche;
      const response = await api.get('/users', { params });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compteurs par rôle affichés sur les onglets (sans filtre de statut/recherche).
  const fetchCounts = useCallback(async () => {
    try {
      const response = await api.get('/users');
      const all = response.data.users;
      setCounts({
        '': all.length,
        admin: all.filter((u) => u.role === 'admin').length,
        agent: all.filter((u) => u.role === 'agent').length,
        client: all.filter((u) => u.role === 'client').length,
      });
    } catch (error) {
      console.error('Erreur chargement des compteurs:', error);
    }
  }, []);

  // Requête serveur à chaque changement de rôle/statut/recherche, avec un léger
  // debounce sur la recherche pour éviter une requête par frappe clavier.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(roleFilter, statusFilter, search);
    }, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, roleFilter, fetchUsers]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const refresh = () => {
    fetchUsers(roleFilter, statusFilter, search);
    fetchCounts();
  };

  const handleCreate = async (data) => {
    await api.post('/users', data);
    refresh();
  };

  const handleActiver = async (id) => {
    await api.put(`/users/${id}/activer`);
    refresh();
  };

  const handleBloquer = async (id) => {
    await api.put(`/users/${id}/bloquer`);
    refresh();
  };

  const handleSupprimer = async (id) => {
    await api.delete(`/users/${id}`);
    refresh();
  };

  const handleActiverGroupe = async (ids) => {
    await api.put('/users/groupe/activer', { ids });
    refresh();
  };

  const handleBloquerGroupe = async (ids) => {
    await api.put('/users/groupe/bloquer', { ids });
    refresh();
  };

  const handleSupprimerGroupe = async (ids) => {
    await api.put('/users/groupe/supprimer', { ids });
    refresh();
  };

  const handleRestaurer = async (id) => {
    await api.put(`/users/${id}/restaurer`);
    refresh();
  };

  const handleRestaurerGroupe = async (ids) => {
    await api.put('/users/groupe/restaurer', { ids });
    refresh();
  };

  const handleSupprimerDefinitif = async (id) => {
    await api.delete(`/users/${id}/definitif`);
    refresh();
  };

  const handleSupprimerDefinitifGroupe = async (ids) => {
    await api.delete('/users/groupe/definitif', { data: { ids } });
    refresh();
  };

  const tabActif = ROLE_TABS.find((t) => t.value === roleFilter) || ROLE_TABS[0];
  const modeCorbeille = statusFilter === 'supprime';

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">
            {roleFilter
              ? `Gestion des comptes ${tabActif.label.toLowerCase()}`
              : 'Tous les comptes, tous rôles confondus'}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refresh}>
            <RefreshCw size={16} /> Actualiser
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={16} /> Ajouter plusieurs utilisateurs
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Onglets de séparation par rôle */}
      <div className="role-tabs">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value || 'tous'}
            className={`role-tab ${roleFilter === tab.value ? 'role-tab-active' : ''}`}
            onClick={() => setRoleFilter(tab.value)}
          >
            <tab.icon size={16} />
            {tab.label}
            {counts[tab.value] !== undefined && (
              <span className="role-tab-count">{counts[tab.value]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="filters-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par nom, email, tél ou ID..."
        />
        <div className="filter-group">
          <label className="filter-label">Statut :</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="actif">Actif</option>
            <option value="bloque">Bloqué</option>
            <option value="supprime">🗑 Corbeille</option>
          </select>
        </div>
      </div>

      {modeCorbeille && (
        <div className="alert alert-info" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trash2 size={16} />
          Comptes supprimés : ils n'apparaissent plus ailleurs dans l'application, mais peuvent être restaurés ou effacés définitivement ici.
        </div>
      )}

      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
        </div>
      ) : (
        <UserTable
          users={users}
          modeCorbeille={modeCorbeille}
          onActiver={handleActiver}
          onBloquer={handleBloquer}
          onSupprimer={handleSupprimer}
          onRestaurer={handleRestaurer}
          onSupprimerDefinitif={handleSupprimerDefinitif}
          onActiverGroupe={handleActiverGroupe}
          onBloquerGroupe={handleBloquerGroupe}
          onSupprimerGroupe={handleSupprimerGroupe}
          onRestaurerGroupe={handleRestaurerGroupe}
          onSupprimerDefinitifGroupe={handleSupprimerDefinitifGroupe}
        />
      )}

      {showForm && (
        <UserForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          roleDefaut={roleFilter || 'client'}
        />
      )}

      {showImport && (
        <ImportCSV
          role={roleFilter || undefined}
          onClose={() => { setShowImport(false); refresh(); }}
        />
      )}
    </div>
  );
};

export default UsersPage;
