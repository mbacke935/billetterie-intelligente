import { NavLink } from 'react-router-dom';

// `items` : liste de { path, label, icon } propre à l'espace (client/agent/admin) qui
// englobe ce Sidebar — chaque espace a sa propre navigation, cf. Prompt A.
const Sidebar = ({ items }) => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {items.map((item) => (
            <li key={item.path} className="sidebar-menu-item">
              <NavLink
                to={item.path}
                end={item.end}
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
