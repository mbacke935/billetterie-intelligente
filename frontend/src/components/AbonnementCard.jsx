import { CreditCard, Calendar, MapPin, CheckCircle, XCircle, PauseCircle } from 'lucide-react';

const typeLabels = {
  ticket_simple: 'Ticket Simple',
  abonnement_limite: 'Abonnement Limité',
  abonnement_illimite: 'Abonnement Illimité',
};

const typeColors = {
  ticket_simple: '#1C7293',
  abonnement_limite: '#21295C',
  abonnement_illimite: '#02C39A',
};

const statutBadge = {
  actif: { color: '#38A169', bg: '#DCFCE7', label: 'Actif' },
  suspendu: { color: '#DD6B20', bg: '#FEF3C7', label: 'Suspendu' },
  resilié: { color: '#E53E3E', bg: '#FEE2E2', label: 'Résilié' },
};

const AbonnementCard = ({ abonnement, onSuspendre, onResilier, onRenouveler }) => {
  const badge = statutBadge[abonnement.statut] || statutBadge.actif;
  const typeColor = typeColors[abonnement.type] || '#1C7293';

  return (
    <div style={{
      background: 'var(--bg-card, #1e293b)',
      borderRadius: '12px',
      padding: '1.25rem',
      border: `2px solid ${typeColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} color={typeColor} />
          <span style={{ fontWeight: 'bold', color: typeColor, fontSize: '0.875rem' }}>
            {typeLabels[abonnement.type]}
          </span>
        </div>
        <span style={{
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: badge.color,
          background: badge.bg,
        }}>
          {badge.label}
        </span>
      </div>

      {/* Client */}
      <div>
        <p style={{ fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>{abonnement.client}</p>
        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>{abonnement.email}</p>
      </div>

      {/* Dates */}
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Calendar size={14} />
          <span>Début : {abonnement.dateDebut}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Calendar size={14} />
          <span>Fin : {abonnement.dateExpiration}</span>
        </div>
      </div>

      {/* Voyages */}
      {abonnement.type !== 'abonnement_illimite' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={14} /> Voyages
            </span>
            <span>{abonnement.voyagesConsommes} / {abonnement.voyagesAutorises}</span>
          </div>
          <div style={{ background: '#334155', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${(abonnement.voyagesConsommes / abonnement.voyagesAutorises) * 100}%`,
              height: '100%',
              background: typeColor,
              borderRadius: '999px',
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.3rem 0 0 0' }}>
            {abonnement.voyagesRestants} voyage(s) restant(s)
          </p>
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <MapPin size={14} />
          <span>Illimité — {abonnement.voyagesConsommes} voyage(s) effectué(s)</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        {abonnement.statut === 'actif' && (
          <>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              onClick={() => onSuspendre(abonnement.id)}
            >
              <PauseCircle size={14} /> Suspendre
            </button>
            <button
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem', background: '#E53E3E', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              onClick={() => onResilier(abonnement.id)}
            >
              <XCircle size={14} /> Résilier
            </button>
          </>
        )}
        {abonnement.statut !== 'actif' && (
          <button
            className="btn btn-primary"
            style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
            onClick={() => onRenouveler(abonnement.id)}
          >
            <CheckCircle size={14} /> Renouveler
          </button>
        )}
      </div>
    </div>
  );
};

export default AbonnementCard;