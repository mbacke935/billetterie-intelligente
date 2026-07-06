import { Users, UserCheck, UserX, UserMinus } from 'lucide-react';

const iconMap = {
  total: Users,
  actifs: UserCheck,
  bloques: UserX,
  supprimes: UserMinus,
};

const colorMap = {
  total: 'stats-card-blue',
  actifs: 'stats-card-green',
  bloques: 'stats-card-orange',
  supprimes: 'stats-card-red',
};

const labelMap = {
  total: 'Total',
  actifs: 'Actifs',
  bloques: 'Bloqués',
  supprimes: 'Supprimés',
};

const StatsCard = ({ type, count }) => {
  const Icon = iconMap[type] || Users;
  const colorClass = colorMap[type] || 'stats-card-blue';
  const label = labelMap[type] || type;

  return (
    <div className={`stats-card ${colorClass}`}>
      <div className="stats-card-icon-wrapper">
        <Icon size={24} />
      </div>
      <div className="stats-card-content">
        <span className="stats-card-count">{count}</span>
        <span className="stats-card-label">{label}</span>
      </div>
    </div>
  );
};

export default StatsCard;
