import { useState, useEffect } from 'react';
import api from '../services/api';
import { getStatsBilletterie } from '../services/apiBilletterie';
import { getStatsAbonnements } from '../services/apiAbonnements';
import StatsCard from '../components/StatsCard';
import { ShieldCheck, UserCog, Users, Ticket, XCircle, CreditCard } from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [statsBilletterie, setStatsBilletterie] = useState(null);
  const [erreurBilletterie, setErreurBilletterie] = useState('');
  const [statsAbonnements, setStatsAbonnements] = useState(null);
  const [erreurAbonnements, setErreurAbonnements] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchStatsBilletterie();
    fetchStatsAbonnements();
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

  const fetchStatsBilletterie = async () => {
    try {
      const response = await getStatsBilletterie();
      setStatsBilletterie(response.data);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        setErreurBilletterie("Vous n'avez pas les droits nécessaires pour consulter les statistiques du Service Billetterie.");
      } else {
        setErreurBilletterie('Service Billetterie momentanément injoignable : impossible de récupérer les statistiques des titres et validations. Vérifiez que le service (port 5002) et sa base de données sont bien démarrés.');
      }
    }
  };

  const fetchStatsAbonnements = async () => {
    try {
      const response = await getStatsAbonnements();
      setStatsAbonnements(response.data);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        setErreurAbonnements("Vous n'avez pas les droits nécessaires pour consulter les statistiques du Service Abonnements.");
      } else {
        setErreurAbonnements('Service Abonnements momentanément injoignable : impossible de récupérer les statistiques des abonnements. Vérifiez que le service (port 5001) et sa base de données sont bien démarrés.');
      }
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

  const indicateursBilletterie = statsBilletterie?.indicateurs;
  const indicateursAbonnements = statsAbonnements?.indicateurs;

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
          </div>
        </section>
      </div>

      {/* Service Billetterie : titres et validations */}
      <section className="dashboard-section">
        <h2 className="section-title">
          <Ticket size={20} /> Service Billetterie
        </h2>
        <p className="page-subtitle" style={{ marginTop: '-10px', marginBottom: '16px' }}>
          Titres de transport générés et validations effectuées par les agents (données en direct)
        </p>

        {erreurBilletterie ? (
          <div className="alert alert-error">{erreurBilletterie}</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stats-card" style={{ borderLeft: '4px solid #1C7293' }}>
                <div className="stats-card-content">
                  <span className="stats-card-count" style={{ color: '#1C7293' }}>
                    {indicateursBilletterie?.total_titres ?? 0}
                  </span>
                  <span className="stats-card-label">Titres générés</span>
                </div>
              </div>
              <div className="stats-card" style={{ borderLeft: '4px solid #02C39A' }}>
                <div className="stats-card-content">
                  <span className="stats-card-count" style={{ color: '#02C39A' }}>
                    {indicateursBilletterie?.titres_actifs ?? 0}
                  </span>
                  <span className="stats-card-label">Titres actifs</span>
                </div>
              </div>
              <div className="stats-card" style={{ borderLeft: '4px solid #38A169' }}>
                <div className="stats-card-content">
                  <span className="stats-card-count" style={{ color: '#38A169' }}>
                    {indicateursBilletterie?.validations_autorisees ?? 0}
                  </span>
                  <span className="stats-card-label">Validations autorisées</span>
                </div>
              </div>
              <div className="stats-card" style={{ borderLeft: '4px solid #E53E3E' }}>
                <div className="stats-card-content">
                  <span className="stats-card-count" style={{ color: '#E53E3E' }}>
                    {indicateursBilletterie?.validations_refusees ?? 0}
                  </span>
                  <span className="stats-card-label">Validations refusées</span>
                </div>
              </div>
              <div className="stats-card" style={{ borderLeft: '4px solid #DD6B20' }}>
                <div className="stats-card-content">
                  <span className="stats-card-count" style={{ color: '#DD6B20' }}>
                    {indicateursBilletterie?.taux_refus_pourcent ?? 0}%
                  </span>
                  <span className="stats-card-label">Taux de refus (validations)</span>
                </div>
              </div>
            </div>

            {statsBilletterie?.top_motifs_refus?.length > 0 && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.5rem',
                marginTop: '1rem',
              }}>
                <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Principaux motifs de refus
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {statsBilletterie.top_motifs_refus.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <XCircle size={14} color="var(--danger)" /> {m.motif_refus || 'Motif non précisé'}
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{m.total}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Service Abonnements : formules souscrites et voyages consommés */}
      <section className="dashboard-section">
        <h2 className="section-title">
          <CreditCard size={20} /> Service Abonnements
        </h2>
        <p className="page-subtitle" style={{ marginTop: '-10px', marginBottom: '16px' }}>
          Abonnements souscrits par les clients, répartition par formule et par statut
        </p>

        {erreurAbonnements ? (
          <div className="alert alert-error">{erreurAbonnements}</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stats-card" style={{ borderLeft: '4px solid #1C7293' }}>
                <div className="stats-card-content">
                  <span className="stats-card-count" style={{ color: '#1C7293' }}>
                    {indicateursAbonnements?.total_abonnements ?? 0}
                  </span>
                  <span className="stats-card-label">Abonnements créés</span>
                </div>
              </div>
              <div className="stats-card" style={{ borderLeft: '4px solid #02C39A' }}>
                <div className="stats-card-content">
                  <span className="stats-card-count" style={{ color: '#02C39A' }}>
                    {indicateursAbonnements?.total_clients_uniques ?? 0}
                  </span>
                  <span className="stats-card-label">Clients abonnés</span>
                </div>
              </div>
              <div className="stats-card" style={{ borderLeft: '4px solid #DD6B20' }}>
                <div className="stats-card-content">
                  <span className="stats-card-count" style={{ color: '#DD6B20' }}>
                    {indicateursAbonnements?.somme_voyages_consommes_declaratifs ?? 0}
                  </span>
                  <span className="stats-card-label">Voyages consommés</span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginTop: '1rem',
            }}>
              {statsAbonnements?.repartition_par_statut?.length > 0 && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.5rem',
                }}>
                  <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Répartition par statut
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {statsAbonnements.repartition_par_statut.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>{s.statut}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{s.total}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {statsAbonnements?.repartition_par_formule?.length > 0 && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.5rem',
                }}>
                  <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Répartition par formule
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {statsAbonnements.repartition_par_formule.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>{f.type_nom}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{f.total}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
