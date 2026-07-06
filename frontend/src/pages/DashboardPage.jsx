import { useState, useEffect } from 'react';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import { ShieldCheck, UserCog, Users } from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Stats globales */}
      <section className="dashboard-section">
        <h2 className="section-title">
          <Users size={20} /> Vue globale
        </h2>
        <div className="stats-grid">
          <StatsCard type="total" count={stats?.global?.total || 0} />
          <StatsCard type="actifs" count={stats?.global?.actifs || 0} />
          <StatsCard type="bloques" count={stats?.global?.bloques || 0} />
          <StatsCard type="supprimes" count={stats?.global?.supprimes || 0} />
        </div>
      </section>

      {/* Stats par rôle */}
      <div className="dashboard-roles-grid">
        <section className="dashboard-role-section">
          <h2 className="section-title">
            <ShieldCheck size={20} /> Administrateurs
          </h2>
          <div className="stats-grid stats-grid-sm">
            <StatsCard type="total" count={stats?.admins?.total || 0} />
            <StatsCard type="actifs" count={stats?.admins?.actifs || 0} />
            <StatsCard type="bloques" count={stats?.admins?.bloques || 0} />
            <StatsCard type="supprimes" count={stats?.admins?.supprimes || 0} />
          </div>
        </section>

        <section className="dashboard-role-section">
          <h2 className="section-title">
            <UserCog size={20} /> Agents
          </h2>
          <div className="stats-grid stats-grid-sm">
            <StatsCard type="total" count={stats?.agents?.total || 0} />
            <StatsCard type="actifs" count={stats?.agents?.actifs || 0} />
            <StatsCard type="bloques" count={stats?.agents?.bloques || 0} />
            <StatsCard type="supprimes" count={stats?.agents?.supprimes || 0} />
          </div>
        </section>

        <section className="dashboard-role-section">
          <h2 className="section-title">
            <Users size={20} /> Clients
          </h2>
          <div className="stats-grid stats-grid-sm">
            <StatsCard type="total" count={stats?.clients?.total || 0} />
            <StatsCard type="actifs" count={stats?.clients?.actifs || 0} />
            <StatsCard type="bloques" count={stats?.clients?.bloques || 0} />
            <StatsCard type="supprimes" count={stats?.clients?.supprimes || 0} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
