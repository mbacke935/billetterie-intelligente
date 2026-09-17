import { Outlet } from 'react-router-dom';
import { Ticket, ShoppingCart, History, UserCircle } from 'lucide-react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';

// Espace Client (/client/*) : navigation simplifiée au strict nécessaire pour un passager
// (cf. Prompt A) — aucun outil de scan ni d'administration n'y apparaît.
const menuItems = [
  { path: '/client/titres', label: 'Mes Titres / QR Codes', icon: Ticket },
  { path: '/client/acheter', label: 'Acheter / S\'abonner', icon: ShoppingCart },
  { path: '/client/historique', label: 'Mes déplacements', icon: History },
  { path: '/client/profil', label: 'Mon Profil', icon: UserCircle },
];

const ClientLayout = () => (
  <div className="app-layout">
    <Navbar profilePath="/client/profil" />
    <div className="app-body">
      <Sidebar items={menuItems} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  </div>
);

export default ClientLayout;
