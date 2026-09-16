import { MapPin, Calendar, Hash, CheckCircle, XCircle } from 'lucide-react';

const VoyagesTable = ({ voyages }) => {
  if (!voyages || voyages.length === 0) {
    return (
      <div className="table-empty" style={{ textAlign: 'center', padding: '2rem' }}>
        Aucun voyage enregistré.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th><Hash size={14} /> ID</th>
            <th>Client</th>
            <th>Type titre</th>
            <th><Calendar size={14} /> Date de validation</th>
            <th><MapPin size={14} /> Référence</th>
            <th>Résultat</th>
          </tr>
        </thead>
        <tbody>
          {voyages.map((voyage) => {
            const autorise = voyage.resultat === 'autorise';
            return (
              <tr key={voyage.id}>
                <td>#{String(voyage.id).slice(0, 8)}</td>
                <td>{voyage.client}</td>
                <td>{voyage.typeAbonnement}</td>
                <td>{voyage.dateVoyage}</td>
                <td>{voyage.idValidation}</td>
                <td>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: autorise ? '#38A169' : '#E53E3E',
                    background: autorise ? '#DCFCE7' : '#FEE2E2',
                  }}
                    title={!autorise ? voyage.motifRefus : undefined}
                  >
                    {autorise ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {autorise ? 'Autorisé' : 'Refusé'}
                  </span>
                  {!autorise && voyage.motifRefus && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {voyage.motifRefus}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default VoyagesTable;
