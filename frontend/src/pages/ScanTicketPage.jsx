import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, CheckCircle, XCircle } from 'lucide-react';
import { scannerQrCode, validerManuellement } from '../services/apiBilletterie';

const READER_ID = 'qr-reader';

// Formate une date ISO en date + heure complètes (ex. 25/07/2026 14:32)
const formatDateHeure = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const ScanTicketPage = () => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [erreurCamera, setErreurCamera] = useState('');
  const [idManuel, setIdManuel] = useState('');

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

  const traiterResultat = async (qrData) => {
    await arreterScanner();
    setScanning(false);
    try {
      const { data } = await scannerQrCode(qrData);
      setResult(data);
    } catch (err) {
      setResult(err.response?.data || { statut_validation: 'ERREUR', message: 'Erreur de validation.' });
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
    } catch (err) {
      setResult(err.response?.data || { statut_validation: 'ERREUR', message: 'Erreur de validation.' });
    }
  };

  const estValide = result?.statut_validation === 'VALIDE';

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Scanner un ticket</h1>
          <p className="page-subtitle">Validez un titre de transport (QR Code ou identifiant)</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ width: '320px' }}>
          {!scanning ? (
            <button className="btn btn-primary" onClick={demarrerScanner} style={{ width: '100%' }}>
              <ScanLine size={16} /> Démarrer le scan
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={arreterScanner} style={{ width: '100%' }}>
              Arrêter le scan
            </button>
          )}

          <div id={READER_ID} style={{ marginTop: '1rem', width: '100%' }} />

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
        </div>

        {result && (
          <div
            className={`alert ${estValide ? 'alert-success' : 'alert-error'}`}
            style={{ flex: 1, minWidth: '280px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
          >
            {estValide ? <CheckCircle size={22} /> : <XCircle size={22} />}
            <div>
              <strong>{estValide ? 'Voyage validé' : 'Validation refusée'}</strong>
              <p style={{ margin: '0.25rem 0 0' }}>
                {result.message || result.raison || 'Erreur inconnue.'}
              </p>
              {result.details && (
                <>
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                    <li>Formule : {result.details.type_titre}</li>
                    <li>
                      Voyages restants :{' '}
                      {result.details.abonnement?.voyages_restants === -1
                        ? 'Illimité'
                        : result.details.abonnement?.voyages_restants}
                    </li>
                    <li>Statut de l'abonnement : {result.details.abonnement?.statut}</li>
                    <li>Heure de validation : {formatDateHeure(result.details.date_validation)}</li>
                  </ul>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Réf. validation : {result.details.validation_id}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanTicketPage;
