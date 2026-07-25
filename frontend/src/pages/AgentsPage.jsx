import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import UserTable from '../components/UserTable';
import UserForm from '../components/UserForm';
import ImportCSV from '../components/ImportCSV';
import { Plus, Upload, RefreshCw } from 'lucide-react';

const AgentsPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Le rôle est fixe (agent) ; statut et recherche sont délégués au backend
  // via des query params plutôt que filtrés côté client sur la liste complète.
  const fetchUsers = useCallback(async (statut, recherche) => {
    try {
      setLoading(true);
      const params = { role: 'agent' };
      if (statut) params.statut = statut;
      if (recherche) params.search = recherche;
      const response = await api.get('/users', { params });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(statusFilter, search);
    }, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, fetchUsers]);

  const filteredUsers = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  const handleCreate = async (data) => {
    await api.post('/users', { ...data, role: 'agent' });
    fetchUsers(statusFilter, search);
  };

  const handleActiver = async (id) => {
    await api.put(`/users/${id}/activer`);
    fetchUsers(statusFilter, search);
  };

  const handleBloquer = async (id) => {
    await api.put(`/users/${id}/bloquer`);
    fetchUsers(statusFilter, search);
  };

  const handleSupprimer = async (id) => {
    await api.delete(`/users/${id}`);
    fetchUsers(statusFilter, search);
  };

  const handleActiverGroupe = async (ids) => {
    await api.put('/users/groupe/activer', { ids });
    fetchUsers(statusFilter, search);
  };

  const handleBloquerGroupe = async (ids) => {
    await api.put('/users/groupe/bloquer', { ids });
    fetchUsers(statusFilter, search);
  };

  const handleSupprimerGroupe = async (ids) => {
    await api.put('/users/groupe/supprimer', { ids });
    fetchUsers(statusFilter, search);
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agents</h1>
          <p className="page-subtitle">Gestion des comptes agents</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => fetchUsers(statusFilter, search)}>
            <RefreshCw size={16} /> Actualiser
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={16} /> Importer CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
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
            <option value="supprime">Supprimé</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Rôle :</label>
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="client">Client</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          onActiver={handleActiver}
          onBloquer={handleBloquer}
          onSupprimer={handleSupprimer}
          onActiverGroupe={handleActiverGroupe}
          onBloquerGroupe={handleBloquerGroupe}
          onSupprimerGroupe={handleSupprimerGroupe}
        />
      )}

      {showForm && (
        <UserForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          roleDefaut="agent"
        />
      )}

      {showImport && (
        <ImportCSV
          role="agent"
          onClose={() => { setShowImport(false); fetchUsers(statusFilter, search); }}
        />
      )}
    </div>
  );
};

export default AgentsPage;
