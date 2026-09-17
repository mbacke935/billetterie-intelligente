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

// Configuration visuelle (couleur texte, couleur fond, texte affiché) des badges selon le statut.
// Le libellé du statut "resilié" dépend du type de titre : un ticket simple à usage unique
// est "Annulé" (il n'y a pas de contrat à résilier), alors qu'un abonnement est bien "Résilié".
const statutBadge = {
  actif: { color: '#38A169', bg: '#DCFCE7', label: 'Actif' },
  suspendu: { color: '#DD6B20', bg: '#FEF3C7', label: 'Suspendu' },
  resilié: { color: '#E53E3E', bg: '#FEE2E2', label: 'Résilié' },
};

const labelStatutResilie = (type) => (type === 'ticket_simple' ? 'Annulé' : 'Résilié');

// Seuil en dessous duquel la jauge de voyages restants passe en couleur d'alerte
const SEUIL_VOYAGES_FAIBLE = 2;

// Formate une date ISO en date + heure complètes (ex. 25/07/2026 14:32)
const formatDateHeure = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Compte à rebours précis (jours/heures/minutes) jusqu'à la date d'expiration,
// calculé à partir de l'horodatage exact de validation du ticket (date_expiration
// est dérivée de la date_debut exacte, à la minute près, pas seulement du jour).
const formatCompteARebours = (dateExpirationStr) => {
  const diffMs = new Date(dateExpirationStr) - new Date();
  if (diffMs <= 0) return 'Expiré';

  const totalMinutes = Math.floor(diffMs / 60000);
  const jours = Math.floor(totalMinutes / (60 * 24));
  const heures = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (jours > 0) return `Expire dans ${jours}j ${heures}h`;
  if (heures > 0) return `Expire dans ${heures}h ${minutes}min`;
  return `Expire dans ${minutes}min`;
};

// Composant principal représentant la carte d'un abonnement ou d'un ticket.
// `qrBasePath` : préfixe de route vers la page QR Code, différent selon l'espace qui
// affiche la carte (/admin/abonnements en gestion, /client/titres côté passager).
// `readOnly` : masque les actions de gestion (suspendre/annuler/résilier/renouveler),
// utilisé dans l'espace Client où un passager consulte ses titres sans les administrer.
const AbonnementCard = ({ abonnement, onSuspendre, onResilier, onRenouveler, qrBasePath = '/admin/abonnements', readOnly = false }) => {
  // Initialisation du hook pour la redirection vers la page du QR code
  const navigate = useNavigate();

  // Récupération de la configuration du badge selon le statut (repli sur 'actif' par défaut) ;
  // le libellé "resilié" est précisé selon le type de titre (ticket vs abonnement).
  const badge = statutBadge[abonnement.statut] || statutBadge.actif;
  const badgeLabel = abonnement.statut === 'resilié' ? labelStatutResilie(abonnement.type) : badge.label;
  // Récupération de la couleur associée au type d'abonnement (couleur par défaut si non trouvé)
  const typeColor = typeColors[abonnement.type] || '#1C7293';

  const estActif = abonnement.statut === 'actif';
  const estTicketSimple = abonnement.type === 'ticket_simple';
  const estLimite = abonnement.type === 'abonnement_limite';
  const voyagesFaibles = estLimite && abonnement.voyagesRestants <= SEUIL_VOYAGES_FAIBLE;

  return (
    <div
      className="ticket-card"
      style={{ '--ticket-accent': typeColor }}
    >
      {/* Bande d'accent en haut, colorée selon le type de titre */}
      <div className="ticket-card-accent" />

      <div className="ticket-card-body">
        {/* En-tête : Affiche l'icône, le type d'abonnement et le badge de statut actuel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CreditCard size={16} color={typeColor} />
            <span style={{ fontWeight: 700, color: typeColor, fontSize: '0.8rem' }}>
              {typeLabels[abonnement.type]}
            </span>
          </div>
          <span style={{
            padding: '0.15rem 0.55rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: badge.color,
            background: badge.bg,
          }}>
            {badgeLabel}
          </span>
        </div>

        {/* Informations Client : Nom et adresse email de l'abonné */}
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, color: 'var(--text-primary)' }}>{abonnement.client}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{abonnement.email}</p>
        </div>

        {/* Dates de validité : date + heure exactes de début et d'expiration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={13} />
            <span>Début : {formatDateHeure(abonnement.dateDebut)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={13} />
            <span>Fin : {formatDateHeure(abonnement.dateExpiration)}</span>
          </div>
        </div>

        {/* Suivi des Voyages : selon le type de titre */}
        {estTicketSimple ? (
          // Ticket simple : indicateur binaire, une jauge n'a pas de sens sur 1 seul voyage
          <div style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-full)',
            color: abonnement.voyagesConsommes > 0 ? 'var(--text-secondary)' : 'var(--success)',
            background: abonnement.voyagesConsommes > 0 ? 'var(--bg-tertiary)' : 'rgba(16, 185, 129, 0.12)',
          }}>
            <MapPin size={13} />
            {abonnement.voyagesConsommes > 0 ? 'Utilisé' : 'Non utilisé'}
          </div>
        ) : estLimite ? (
          // Abonnement limité : jauge de progression, en alerte quand le solde devient faible
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', color: voyagesFaibles ? 'var(--warning)' : 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={13} /> {abonnement.voyagesRestants} restant(s)
              </span>
              <span>{abonnement.voyagesConsommes} / {abonnement.voyagesAutorises}</span>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', height: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${(abonnement.voyagesConsommes / abonnement.voyagesAutorises) * 100}%`,
                height: '100%',
                background: voyagesFaibles ? 'var(--warning)' : typeColor,
                borderRadius: 'var(--radius-full)',
              }} />
            </div>
          </div>
        ) : (
          // Abonnement illimité : la contrainte réelle est la date, pas un compteur de voyages
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={13} />
            <span>{formatCompteARebours(abonnement.dateExpiration)}</span>
          </div>
        )}
      </div>

      {/* Souche du ticket, séparée par une ligne pointillée, qui regroupe les actions */}
      <div className="ticket-card-stub">
        {/* QR Code disponible pour les 3 types de titres : tous sont scannés à l'usage */}
        <button
          className="btn btn-primary"
          style={{ fontSize: '0.78rem', padding: '0.4rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
          onClick={() => navigate(`${qrBasePath}/${abonnement.id}/qrcode`)}
        >
          <QrCode size={14} /> Voir QR Code
        </button>

        {/* Actions de gestion (suspendre/annuler/résilier/renouveler) : masquées côté
            Client, qui consulte ses titres sans les administrer. */}
        {!readOnly && (
        <>
        {/* Ticket simple : titre à usage unique, ni suspension ni renouvellement n'ont de sens.
            On "annule" un ticket, on ne "résilie" pas un contrat qui n'existe pas. */}
        {estTicketSimple && estActif && (
          <button
            className="btn btn-danger"
            style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
            onClick={() => onResilier(abonnement.id)}
          >
            <XCircle size={14} /> Annuler
          </button>
        )}

        {/* Abonnements limité/illimité : suspendre/résilier tant qu'actif */}
        {!estTicketSimple && estActif && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              onClick={() => onSuspendre(abonnement.id)}
            >
              <PauseCircle size={14} /> Suspendre
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              onClick={() => onResilier(abonnement.id)}
            >
              <XCircle size={14} /> Résilier
            </button>
          </div>
        )}

        {/* Abonnement limité : renouvellement possible même actif, pour anticiper la fin du solde */}
        {estLimite && (
          <button
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
            onClick={() => onRenouveler(abonnement.id)}
          >
            <CheckCircle size={14} /> Renouveler
          </button>
        )}

        {/* Abonnement illimité non actif : seule option, le renouvellement */}
        {!estTicketSimple && !estLimite && !estActif && (
          <button
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
            onClick={() => onRenouveler(abonnement.id)}
          >
            <CheckCircle size={14} /> Renouveler
          </button>
        )}
        </>
        )}
      </div>
    </div>
  );
};

// Exportation par défaut du composant pour son utilisation dans le reste de l'application
export default AbonnementCard;