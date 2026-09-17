import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, CheckCircle, XCircle, RotateCcw, History } from 'lucide-react';
import { scannerQrCode, validerManuellement } from '../../services/apiBilletterie';

const READER_ID = 'qr-reader-agent';

const formatHeure = (dateStr) => {
  if (!dateStr) return new Date().toLocaleTimeString('fr-FR');
  return new Date(dateStr).toLocaleTimeString('fr-FR');
};

// Espace Agent : écran de contrôle plein écran (cf. Prompt C). Un scan (caméra ou saisie
// manuelle de secours) débouche immédiatement sur un écran VERT (voyage autorisé) ou ROUGE
// (refusé, motif affiché en gros) à fort contraste, pensé pour être lisible en plein soleil
// sur un terminal mobile. L'historique de la session (non persisté) reste visible en dessous.
const ScanAgentPage = () => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [erreurCamera, setErreurCamera] = useState('');
  const [idManuel, setIdManuel] = useState('');
  const [historiqueSession, setHistoriqueSession] = useState([]);

  const arreterScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // le scanner était déjà arrêté
      }
    }
  };

  const enregistrerDansHistorique = (data) => {
    setHistoriqueSession((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        heure: formatHeure(data?.details?.date_validation),
        estValide: data?.statut_validation === 'VALIDE',
        typeTitre: data?.details?.type_titre || '—',
        raison: data?.raison || data?.message,
      },
      ...prev,
    ].slice(0, 50));
  };

  const traiterResultat = async (qrData) => {
    await arreterScanner();
    setScanning(false);
    try {
      const { data } = await scannerQrCode(qrData);
      setResult(data);
      enregistrerDansHistorique(data);
    } catch (err) {
      const data = err.response?.data || { statut_validation: 'ERREUR', message: 'Erreur de validation.' };
      setResult(data);
      enregistrerDansHistorique(data);
    }
  };

  const demarrerScanner = async () => {
    setResult(null);
    setErreurCamera('');
    setScanning(true);

    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => traiterResultat(decodedText),
        () => {} // erreurs de décodage image par image, ignorées (scan continu)
      );
    } catch (err) {
      setScanning(false);
      setErreurCamera('Impossible d\'accéder à la caméra. Vérifiez les autorisations ou saisissez l\'identifiant manuellement.');
    }
  };

  useEffect(() => {
    return () => {
      arreterScanner();
    };
  }, []);

  const handleValidationManuelle = async (e) => {
    e.preventDefault();
    if (!idManuel.trim()) return;
    setResult(null);
    try {
      const { data } = await validerManuellement(idManuel.trim());
      setResult(data);
      enregistrerDansHistorique(data);
    } catch (err) {
      const data = err.response?.data || { statut_validation: 'ERREUR', message: 'Erreur de validation.' };
      setResult(data);
      enregistrerDansHistorique(data);
    } finally {
      setIdManuel('');
    }
  };

  const rescanner = () => {
    setResult(null);
    demarrerScanner();
  };

  const estValide = result?.statut_validation === 'VALIDE';

  // Écran plein écran à fort contraste, une fois qu'un résultat est disponible.
  if (result) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 70px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
          background: estValide ? '#16A34A' : '#DC2626',
          color: '#fff',
        }}
      >
        {estValide ? <CheckCircle size={96} /> : <XCircle size={96} />}
        <h1 style={{ fontSize: '2.25rem', margin: 0 }}>
          {estValide ? 'VOYAGE AUTORISÉ' : 'VOYAGE REFUSÉ'}
        </h1>

        {estValide ? (
          <p style={{ fontSize: '1.25rem', margin: 0, opacity: 0.95 }}>
            Formule : {result.details?.type_titre || '—'}
            {result.details?.abonnement?.voyages_restants !== undefined && (
              <>
                {' '}· Voyages restants :{' '}
                {result.details.abonnement.voyages_restants === -1 ? 'Illimité' : result.details.abonnement.voyages_restants}
              </>
            )}
          </p>
        ) : (
          <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, maxWidth: '480px' }}>
            {result.raison || result.message || 'Erreur inconnue.'}
          </p>
        )}

        <button
          className="btn btn-secondary"
          style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }}
          onClick={rescanner}
        >
          <RotateCcw size={16} /> Scanner le suivant
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Contrôle des titres</h1>
        <p className="page-subtitle">Scannez le QR Code du passager pour valider son voyage</p>
      </div>

      {!scanning ? (
        <button className="btn btn-primary btn-block" onClick={demarrerScanner} style={{ padding: '1rem', fontSize: '1rem' }}>
          <ScanLine size={20} /> Démarrer le scan
        </button>
      ) : (
        <button className="btn btn-secondary btn-block" onClick={arreterScanner} style={{ padding: '1rem', fontSize: '1rem' }}>
          Arrêter le scan
        </button>
      )}

      <div id={READER_ID} style={{ marginTop: '1rem', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} />

      {erreurCamera && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{erreurCamera}</div>}

      <form onSubmit={handleValidationManuelle} style={{ marginTop: '1.5rem' }}>
        <label className="filter-label">Identifiant du titre (secours si le scan échoue) :</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            value={idManuel}
            onChange={(e) => setIdManuel(e.target.value)}
            placeholder="UUID du titre de transport"
          />
          <button type="submit" className="btn btn-secondary">Valider</button>
        </div>
      </form>

      {/* Historique des scans effectués pendant cette session (non persisté, remis à zéro
          au rechargement de la page) */}
      <div style={{ marginTop: '2rem' }}>
        <h2 className="section-title" style={{ fontSize: '15px' }}>
          <History size={18} /> Contrôles de cette session ({historiqueSession.length})
        </h2>
        {historiqueSession.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Aucun contrôle effectué pour l'instant.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Formule</th>
                  <th>Résultat</th>
                </tr>
              </thead>
              <tbody>
                {historiqueSession.map((h) => (
                  <tr key={h.id}>
                    <td>{h.heure}</td>
                    <td>{h.typeTitre}</td>
                    <td>
                      <span className={`badge ${h.estValide ? 'badge-green' : 'badge-red'}`}>
                        {h.estValide ? 'Autorisé' : 'Refusé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanAgentPage;
