import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

const ImportCSV = ({ onImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier CSV.');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Lire et prévisualiser le CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1, 6).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const row = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });
      setPreview(rows);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      // Lire tout le fichier et envoyer les données ligne par ligne
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim());

        let success = 0;
        let errors = 0;
        const errorMessages = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const userData = {};
          headers.forEach((header, index) => {
            userData[header] = values[index] || '';
          });

          try {
            await onImport(userData);
            success++;
          } catch (err) {
            errors++;
            errorMessages.push(`Ligne ${i + 1}: ${err.response?.data?.message || err.message}`);
          }
        }

        setResult({ success, errors, errorMessages });
        setLoading(false);
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Erreur lors de l\'import.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Importer un fichier CSV</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {result ? (
          <div className="import-result">
            <div className="alert alert-success">
              {result.success} utilisateur(s) importé(s) avec succès.
            </div>
            {result.errors > 0 && (
              <div className="alert alert-error">
                {result.errors} erreur(s) :
                <ul className="import-error-list">
                  {result.errorMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={onClose}>Fermer</button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="import-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                hidden
              />
              {file ? (
                <div className="import-file-info">
                  <FileText size={32} />
                  <span>{file.name}</span>
                </div>
              ) : (
                <div className="import-placeholder">
                  <Upload size={40} />
                  <p>Cliquez pour sélectionner un fichier CSV</p>
                  <span className="import-hint">Format : nom, prenom, email, telephone, role, motDePasse</span>
                </div>
              )}
            </div>

            {preview.length > 0 && (
              <div className="import-preview">
                <h3>Aperçu ({preview.length} premières lignes)</h3>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={!file || loading}
              >
                {loading ? 'Importation...' : 'Importer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportCSV;
