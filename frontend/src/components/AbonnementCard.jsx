// Importation unique de tous les composants d'icônes nécessaires depuis lucide-react
import { CreditCard, Calendar, MapPin, CheckCircle, XCircle, PauseCircle, QrCode } from 'lucide-react';
// Importation du hook de navigation pour rediriger l'utilisateur vers une autre page
import { useNavigate } from 'react-router-dom';

// Dictionnaire pour faire correspondre les types techniques d'abonnement à des labels lisibles
const typeLabels = {
  ticket_simple: 'Ticket Simple',
  abonnement_limite: 'Abonnement Limité',
  abonnement_illimite: 'Abonnement Illimité',
};

// Couleurs thématiques associées à chaque type d'abonnement
const typeColors = {
  ticket_simple: '#1C7293',
  abonnement_limite: '#21295C',
  abonnement_illimite: '#02C39A',
};

// Configuration visuelle (couleur texte, couleur fond, texte affiché) des badges selon le statut
const statutBadge = {
  actif: { color: '#38A169', bg: '#DCFCE7', label: 'Actif' },
  suspendu: { color: '#DD6B20', bg: '#FEF3C7', label: 'Suspendu' },
  resilié: { color: '#E53E3E', bg: '#FEE2E2', label: 'Résilié' },
};

// Composant principal représentant la carte d'un abonnement ou d'un ticket
const AbonnementCard = ({ abonnement, onSuspendre, onResilier, onRenouveler }) => {
  // Initialisation du hook pour la redirection vers la page du QR code
  const navigate = useNavigate();
  
  // Récupération de la configuration du badge selon le statut (repli sur 'actif' par défaut)
  const badge = statutBadge[abonnement.statut] || statutBadge.actif;
  // Récupération de la couleur associée au type d'abonnement (couleur par défaut si non trouvé)
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
      {/* En-tête : Affiche l'icône, le type d'abonnement et le badge de statut actuel */}
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

      {/* Informations Client : Nom et adresse email de l'abonné */}
      <div>
        <p style={{ fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>{abonnement.client}</p>
        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>{abonnement.email}</p>
      </div>

      {/* Dates de validité : Date de début et date d'expiration de l'abonnement */}
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

      {/* Suivi des Voyages : Jauge de progression pour les abonnements limités ou simple texte pour l'illimité */}
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

      {/* Zone des Actions : Contient le bouton QR code et les boutons de gestion d'état */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
        
        {/* Bouton QR Code : Affiché uniquement s'il s'agit d'un ticket simple */}
        {abonnement.type === 'ticket_simple' && (
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
            onClick={() => navigate(`/abonnements/${abonnement.id}/qrcode`)}
          >
            <QrCode size={14} /> Voir QR Code
          </button>
        )}

        {/* Boutons d'administration secondaires alignés horizontalement */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Si l'abonnement est actif, on propose de le suspendre ou de le résilier */}
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
          {/* Si l'abonnement n'est pas actif, on propose uniquement de le renouveler */}
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
    </div>
  );
};

// Exportation par défaut du composant pour son utilisation dans le reste de l'application
export default AbonnementCard;