import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import api from '../services/api';

const ImportCSV = ({ role, onClose }) => {
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
      const formData = new FormData();
      formData.append('fichier', file);
      if (role) {
        formData.append('role', role);
      }

      // Le fichier est parsé côté serveur (csv-parser), qui gère correctement
      // les virgules/guillemets dans les champs contrairement à un split naïf.
      const { data } = await api.post('/users/import', formData, {
        headers: { 'Content-Type': undefined },
      });

      setResult({
        success: data.success,
        errors: data.errors,
        errorMessages: data.errorMessages,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'import.');
    } finally {
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
                  <span className="import-hint">Colonnes attendues : nom, prenom, email, telephone{role ? '' : ', role'}</span>
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
