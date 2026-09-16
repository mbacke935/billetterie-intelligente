import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCircle, CreditCard, MapPin, ScanLine } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/utilisateurs', label: 'Utilisateurs', icon: Users },
    { path: '/abonnements', label: 'Abonnements', icon: CreditCard },
    { path: '/voyages', label: 'Voyages', icon: MapPin },
    { path: '/scan', label: 'Scanner un ticket', icon: ScanLine },
    { path: '/profile', label: 'Mon Profil', icon: UserCircle },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-menu-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <item.icon size={20} className="sidebar-link-icon" />
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;