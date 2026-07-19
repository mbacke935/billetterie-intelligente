import { MapPin, Calendar, Hash } from 'lucide-react';

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
            <th>Type abonnement</th>
            <th><Calendar size={14} /> Date du voyage</th>
            <th><MapPin size={14} /> Validation</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {voyages.map((voyage) => (
            <tr key={voyage.id}>
              <td>#{voyage.id}</td>
              <td>{voyage.client}</td>
              <td>{voyage.typeAbonnement}</td>
              <td>{voyage.dateVoyage}</td>
              <td>{voyage.idValidation}</td>
              <td>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#38A169',
                  background: '#DCFCE7',
                }}>
                  Validé
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VoyagesTable;