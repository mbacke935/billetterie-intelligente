import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, UserCog, Users, UserCircle } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admins', label: 'Administrateurs', icon: ShieldCheck },
    { path: '/agents', label: 'Agents', icon: UserCog },
    { path: '/clients', label: 'Clients', icon: Users },
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
