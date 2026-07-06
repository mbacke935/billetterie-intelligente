import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Camera, Save, Eye, EyeOff } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('infos');
  const fileInputRef = useRef(null);

  // Formulaire infos
  const [formInfos, setFormInfos] = useState({ nom: '', prenom: '', email: '', telephone: '' });

  // Formulaire mot de passe
  const [formPassword, setFormPassword] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmerMotDePasse: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    ancien: false,
    nouveau: false,
    confirmer: false,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
      setFormInfos({
        nom: response.data.nom,
        prenom: response.data.prenom,
        email: response.data.email,
        telephone: response.data.telephone,
      });
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleUpdateInfos = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put('/profile', formInfos);
      setProfile(response.data.user);
      updateUser(response.data.user);
      showMessage('success', 'Profil mis à jour avec succès.');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formPassword.nouveauMotDePasse !== formPassword.confirmerMotDePasse) {
      showMessage('error', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/profile/password', {
        ancienMotDePasse: formPassword.ancienMotDePasse,
        nouveauMotDePasse: formPassword.nouveauMotDePasse,
      });
      setFormPassword({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: '' });
      showMessage('success', 'Mot de passe modifié avec succès.');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Erreur lors du changement.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(response.data.user);
      updateUser(response.data.user);
      showMessage('success', 'Photo mise à jour.');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Erreur upload photo.');
    }
  };

  const togglePass = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Chargement du profil...</p>
      </div>
    );
  }

  const roleBadgeClass = {
    admin: 'badge-purple',
    agent: 'badge-blue',
    client: 'badge-green',
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">Mon Profil</h1>
        <p className="page-subtitle">Gérez vos informations personnelles</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="profile-layout">
        {/* Carte avatar */}
        <div className="profile-avatar-card">
          <div className="profile-avatar-wrapper">
            {profile?.photo ? (
              <img src={profile.photo} alt="avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                <User size={48} />
              </div>
            )}
            <button
              className="profile-avatar-edit"
              onClick={() => fileInputRef.current?.click()}
              title="Changer la photo"
            >
              <Camera size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/jpg,image/png"
              onChange={handlePhotoChange}
              hidden
            />
          </div>
          <h2 className="profile-name">{profile?.prenom} {profile?.nom}</h2>
          <span className={`badge ${roleBadgeClass[profile?.role] || 'badge-blue'}`}>
            {profile?.role}
          </span>
          <div className="profile-meta">
            <div className="profile-meta-item">
              <Mail size={14} />
              <span>{profile?.email}</span>
            </div>
            <div className="profile-meta-item">
              <Phone size={14} />
              <span>{profile?.telephone}</span>
            </div>
          </div>
        </div>

        {/* Panneau d'édition */}
        <div className="profile-edit-panel">
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'infos' ? 'profile-tab-active' : ''}`}
              onClick={() => setActiveTab('infos')}
            >
              <User size={16} /> Informations
            </button>
            <button
              className={`profile-tab ${activeTab === 'password' ? 'profile-tab-active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <Lock size={16} /> Mot de passe
            </button>
          </div>

          {activeTab === 'infos' && (
            <form onSubmit={handleUpdateInfos} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formInfos.nom}
                    onChange={(e) => setFormInfos({ ...formInfos, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formInfos.prenom}
                    onChange={(e) => setFormInfos({ ...formInfos, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formInfos.email}
                    onChange={(e) => setFormInfos({ ...formInfos, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formInfos.telephone}
                    onChange={(e) => setFormInfos({ ...formInfos, telephone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="profile-form">
              {['ancien', 'nouveau', 'confirmer'].map((field) => {
                const labels = {
                  ancien: 'Ancien mot de passe',
                  nouveau: 'Nouveau mot de passe',
                  confirmer: 'Confirmer le mot de passe',
                };
                const keys = {
                  ancien: 'ancienMotDePasse',
                  nouveau: 'nouveauMotDePasse',
                  confirmer: 'confirmerMotDePasse',
                };
                return (
                  <div className="form-group" key={field}>
                    <label className="form-label">{labels[field]}</label>
                    <div className="input-icon-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showPasswords[field] ? 'text' : 'password'}
                        className="form-input form-input-icon"
                        value={formPassword[keys[field]]}
                        onChange={(e) =>
                          setFormPassword({ ...formPassword, [keys[field]]: e.target.value })
                        }
                        required
                        minLength={field !== 'ancien' ? 6 : 1}
                      />
                      <button
                        type="button"
                        className="input-icon-right"
                        onClick={() => togglePass(field)}
                      >
                        {showPasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Lock size={16} /> {saving ? 'Modification...' : 'Modifier le mot de passe'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
