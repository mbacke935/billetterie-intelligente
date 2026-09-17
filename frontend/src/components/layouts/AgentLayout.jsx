import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';

// Espace Agent (/agent/*) : pas de sidebar — l'interface de contrôle doit rester plein
// écran et épurée sur mobile/tablette (cf. Prompt C), avec pour seul repère la barre du
// haut (thème, profil, déconnexion).
const AgentLayout = () => (
  <div className="app-layout">
    <Navbar profilePath="/agent/profil" />
    <main className="app-main app-main-full">
      <Outlet />
    </main>
  </div>
);

export default AgentLayout;
