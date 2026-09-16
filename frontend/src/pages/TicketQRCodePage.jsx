import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { getAbonnementById } from '../services/apiAbonnements';
import { getTitreParAbonnement, getTitreQrCode } from '../services/apiBilletterie';

const typeLabels = {
  'Ticket simple': 'Ticket Simple',
  'Limité': 'Abonnement Limité',
  'Illimité': 'Abonnement Illimité',
};

const TicketQRCodePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [abonnement, setAbonnement] = useState(null);
  const [titre, setTitre] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        // Le QR Code appartient au Service Billetterie : on y retrouve le titre associé
        // à cet abonnement, puis son jeton QR — le Service Abonnements ne connaît que
        // les informations d'abonnement (dates, voyages), pas le QR lui-même.
        const [resAbonnement, resTitre] = await Promise.all([
          getAbonnementById(id),
          getTitreParAbonnement(id),
        ]);
        setAbonnement(resAbonnement.data);
        setTitre(resTitre.data);

        const resQr = await getTitreQrCode(resTitre.data.id);
        setQrData(resQr.data.qrData);
      } catch {
        setError('Impossible de charger le ticket. Vérifiez que le Service Billetterie est démarré et qu\'un titre a bien été généré pour cet abonnement.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Chargement du ticket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  // Le ticket n'est réellement utilisable que si l'abonnement ET son titre (QR Code) sont
  // tous les deux actifs : un titre peut être désactivé indépendamment de l'abonnement.
  const estActif = abonnement.statut === 'Actif' && titre?.statut === 'actif';

  return (
    <div className="users-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/abonnements')}
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">QR Code du ticket</h1>
            <p className="page-subtitle">Ticket à présenter lors du voyage</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Imprimer
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '2rem',
        flexWrap: 'wrap',
      }}>

        {/* Carte ticket */}
        <div style={{
          background: 'var(--bg-card, #1e293b)',
          borderRadius: '16px',
          padding: '2rem',
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          border: `2px solid ${estActif ? '#02C39A' : '#E53E3E'}`,
        }}>

          {/* Header ticket */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              background: estActif ? '#02C39A' : '#E53E3E',
              color: '#fff',
              borderRadius: '8px',
              padding: '0.4rem 1rem',
              display: 'inline-block',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}>
              {typeLabels[abonnement.typeAbonnement?.nom] || 'Ticket'}
            </div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.8rem' }}>
              Billetterie Intelligente
            </p>
          </div>

          {/* QR Code */}
          <div style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <QRCodeSVG
              value={qrData}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Statut */}
          <div style={{
            padding: '0.4rem 1.2rem',
            borderRadius: '999px',
            background: estActif ? '#DCFCE7' : '#FEE2E2',
            color: estActif ? '#38A169' : '#E53E3E',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}>
            {estActif ? abonnement.statut : (titre?.statut === 'desactive' ? 'Désactivé' : abonnement.statut)}
          </div>

          {/* Infos */}
          <div style={{ width: '100%', fontSize: '0.85rem', color: '#94A3B8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #334155' }}>
              <span>ID Ticket</span>
              <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>{titre?.id?.slice(0, 8)}...</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #334155' }}>
              <span>Type</span>
              <span style={{ color: '#CBD5E1' }}>{abonnement.typeAbonnement?.nom}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #334155' }}>
              <span>Début</span>
              <span style={{ color: '#CBD5E1' }}>{abonnement.date_debut?.split('T')[0]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #334155' }}>
              <span>Expiration</span>
              <span style={{ color: '#CBD5E1' }}>{abonnement.date_expiration?.split('T')[0]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
              <span>Voyages restants</span>
              <span style={{ color: '#02C39A', fontWeight: 'bold' }}>
                {abonnement.voyages_restants === -1 ? 'Illimité' : abonnement.voyages_restants}
              </span>
            </div>
          </div>

          {/* Message si ticket utilisé */}
          {!estActif && (
            <div style={{
              background: '#FEE2E2',
              color: '#E53E3E',
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              width: '100%',
            }}>
              ❌ {titre?.statut === 'desactive' ? 'Ce titre a été désactivé' : 'Ce ticket a déjà été utilisé ou n\'est plus valide'}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ maxWidth: '300px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Comment utiliser ce ticket ?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { num: '1', text: 'Présentez ce QR Code à l\'agent lors de votre voyage.' },
              { num: '2', text: 'L\'agent scannera le QR Code pour valider votre voyage.' },
              { num: '3', text: 'Le ticket sera désactivé automatiquement après utilisation.' },
              { num: '4', text: 'Conservez ce ticket jusqu\'à la fin de votre voyage.' },
            ].map((item) => (
              <div key={item.num} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  background: '#1C7293',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  fontSize: '0.85rem',
                }}>
                  {item.num}
                </div>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.9rem' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketQRCodePage;