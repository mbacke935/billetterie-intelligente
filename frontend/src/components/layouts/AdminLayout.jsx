import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Ticket, MapPin, UserCircle } from 'lucide-react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';

// Espace Admin (/admin/*) : gestion globale de la plateforme (cf. Prompt A/D).
const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { path: '/admin/abonnements', label: 'Abonnements', icon: CreditCard },
  { path: '/admin/billetterie', label: 'Billetterie & Audit', icon: Ticket },
  { path: '/admin/voyages', label: 'Voyages', icon: MapPin },
  { path: '/admin/profil', label: 'Mon Profil', icon: UserCircle },
];

const AdminLayout = () => (
  <div className="app-layout">
    <Navbar profilePath="/admin/profil" />
    <div className="app-body">
      <Sidebar items={menuItems} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
