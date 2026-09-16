import { useState } from 'react';
import { CheckCircle, XCircle, Trash2, MoreVertical } from 'lucide-react';

const statutBadge = {
  actif: 'badge-green',
  bloque: 'badge-orange',
};

const statutLabel = {
  actif: 'Actif',
  bloque: 'Bloqué',
};

const roleBadge = {
  admin: 'badge-purple',
  agent: 'badge-blue',
  client: 'badge-green',
};

const roleLabel = {
  admin: 'Admin',
  agent: 'Agent',
  client: 'Client',
};

const UserTable = ({ users, onActiver, onBloquer, onSupprimer, onActiverGroupe, onBloquerGroupe, onSupprimerGroupe }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u._id));
    }
  };

  const handleGroupAction = async (action) => {
    if (selectedIds.length === 0) return;

    if (action === 'activer') {
      await onActiverGroupe(selectedIds);
    } else if (action === 'bloquer') {
      await onBloquerGroupe(selectedIds);
    } else if (action === 'supprimer') {
      const confirme = window.confirm(
        `Supprimer définitivement ${selectedIds.length} compte(s) ? Cette action est irréversible et effacera toutes leurs informations.`
      );
      if (!confirme) return;
      await onSupprimerGroupe(selectedIds);
    }

    setSelectedIds([]);
  };

  return (
    <div className="table-container">
      {/* Actions groupées */}
      {selectedIds.length > 0 && (
        <div className="table-group-actions">
          <span className="table-group-count">{selectedIds.length} sélectionné(s)</span>
          <button className="btn btn-sm btn-success" onClick={() => handleGroupAction('activer')}>
            <CheckCircle size={14} /> Activer
          </button>
          <button className="btn btn-sm btn-warning" onClick={() => handleGroupAction('bloquer')}>
            <XCircle size={14} /> Bloquer
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleGroupAction('supprimer')}>
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={users.length > 0 && selectedIds.length === users.length}
                onChange={toggleSelectAll}
                className="table-checkbox"
              />
            </th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="8" className="table-empty">Aucun utilisateur trouvé.</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user._id} className={selectedIds.includes(user._id) ? 'table-row-selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user._id)}
                    onChange={() => toggleSelect(user._id)}
                    className="table-checkbox"
                  />
                </td>
                <td>{user.nom}</td>
                <td>{user.prenom}</td>
                <td>{user.email}</td>
                <td>{user.telephone}</td>
                <td>
                  <span className={`badge ${roleBadge[user.role] || ''}`}>
                    {roleLabel[user.role] || user.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${statutBadge[user.statut] || ''}`}>
                    {statutLabel[user.statut] || user.statut}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn-icon"
                      onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === user._id && (
                      <div className="dropdown-menu">
                        {user.statut !== 'actif' && (
                          <button
                            className="dropdown-item"
                            onClick={() => { onActiver(user._id); setOpenMenuId(null); }}
                          >
                            <CheckCircle size={14} /> Activer
                          </button>
                        )}
                        {user.statut !== 'bloque' && (
                          <button
                            className="dropdown-item"
                            onClick={() => { onBloquer(user._id); setOpenMenuId(null); }}
                          >
                            <XCircle size={14} /> Bloquer
                          </button>
                        )}
                        <button
                          className="dropdown-item dropdown-item-danger"
                          onClick={() => {
                            setOpenMenuId(null);
                            if (window.confirm('Supprimer définitivement ce compte ? Cette action est irréversible et effacera toutes ses informations.')) {
                              onSupprimer(user._id);
                            }
                          }}
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
