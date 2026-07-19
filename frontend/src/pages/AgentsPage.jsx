import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import UserTable from '../components/UserTable';
import UserForm from '../components/UserForm';
import ImportCSV from '../components/ImportCSV';
import { Plus, Upload, RefreshCw } from 'lucide-react';

const AgentsPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', { params: { role: 'agent' } });
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let result = users;

    if (statusFilter) {
      result = result.filter((u) => u.statut === statusFilter);
    }

    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.nom.toLowerCase().includes(s) ||
          u.prenom.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.telephone.includes(s) ||
          (u._id && u._id.toLowerCase().includes(s))
      );
    }

    setFilteredUsers(result);
  }, [search, statusFilter, roleFilter, users]);

  const handleCreate = async (data) => {
    await api.post('/users', { ...data, role: 'agent' });
    fetchUsers();
  };

  const handleActiver = async (id) => {
    await api.put(`/users/${id}/activer`);
    fetchUsers();
  };

  const handleBloquer = async (id) => {
    await api.put(`/users/${id}/bloquer`);
    fetchUsers();
  };

  const handleSupprimer = async (id) => {
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  const handleActiverGroupe = async (ids) => {
    await api.put('/users/groupe/activer', { ids });
    fetchUsers();
  };

  const handleBloquerGroupe = async (ids) => {
    await api.put('/users/groupe/bloquer', { ids });
    fetchUsers();
  };

  const handleSupprimerGroupe = async (ids) => {
    await api.put('/users/groupe/supprimer', { ids });
    fetchUsers();
  };

  const handleImportRow = async (userData) => {
    await api.post('/users', { ...userData, role: 'agent' });
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agents</h1>
          <p className="page-subtitle">Gestion des comptes agents</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchUsers}>
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
          onImport={handleImportRow}
          onClose={() => { setShowImport(false); fetchUsers(); }}
        />
      )}
    </div>
  );
};

export default AgentsPage;
