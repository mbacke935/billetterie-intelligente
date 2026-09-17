import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ClientLayout from './components/layouts/ClientLayout';
import AgentLayout from './components/layouts/AgentLayout';
import AdminLayout from './components/layouts/AdminLayout';
import { homePathForRole } from './utils/roles';

import './index.css';

// Chaque page est chargée à la demande (code-splitting) plutôt que regroupée dans
// un seul gros bundle initial.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ChangerMotDePassePage = lazy(() => import('./pages/ChangerMotDePassePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const TicketQRCodePage = lazy(() => import('./pages/TicketQRCodePage'));

// Espace Client (/client/*)
const MesTitresPage = lazy(() => import('./pages/client/MesTitresPage'));
const AcheterAbonnementPage = lazy(() => import('./pages/client/AcheterAbonnementPage'));
const HistoriqueVoyagesPage = lazy(() => import('./pages/client/HistoriqueVoyagesPage'));

// Espace Agent (/agent/*)
const ScanAgentPage = lazy(() => import('./pages/agent/ScanAgentPage'));

// Espace Admin (/admin/*)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AbonnementsPage = lazy(() => import('./pages/AbonnementsPage'));
const NouvelAbonnementPage = lazy(() => import('./pages/NouvelAbonnementPage'));
const VoyagesPage = lazy(() => import('./pages/VoyagesPage'));
const AdminBilletteriePage = lazy(() => import('./pages/admin/AdminBilletteriePage'));

const PageFallback = () => (
  <div className="page-loading">
    <div className="loading-spinner" />
  </div>
);

// Redirige "/" vers l'espace propre au rôle de l'utilisateur connecté (ou /login sinon).
const RedirectionAccueil = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageFallback />;
  return <Navigate to={isAuthenticated ? homePathForRole(user?.role) : '/login'} replace />;
};

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Route publique */}
            <Route path="/login" element={<LoginPage />} />

            {/* Commune à tous les rôles (hors layout d'espace) */}
            <Route
              path="/changer-mot-de-passe"
              element={
                <ProtectedRoute>
                  <ChangerMotDePassePage />
                </ProtectedRoute>
              }
            />

            {/* ── Espace Client ─────────────────────────────────────────── */}
            <Route
              path="/client"
              element={
                <ProtectedRoute roles={['client']}>
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="titres" replace />} />
              <Route path="titres" element={<MesTitresPage />} />
              <Route path="titres/:id/qrcode" element={<TicketQRCodePage />} />
              <Route path="acheter" element={<AcheterAbonnementPage />} />
              <Route path="historique" element={<HistoriqueVoyagesPage />} />
              <Route path="profil" element={<ProfilePage />} />
            </Route>

            {/* ── Espace Agent ──────────────────────────────────────────── */}
            <Route
              path="/agent"
              element={
                <ProtectedRoute roles={['agent']}>
                  <AgentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="scan" replace />} />
              <Route path="scan" element={<ScanAgentPage />} />
              <Route path="profil" element={<ProfilePage />} />
            </Route>

            {/* ── Espace Admin ──────────────────────────────────────────── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="utilisateurs" element={<UsersPage />} />
              <Route path="abonnements" element={<AbonnementsPage />} />
              <Route path="abonnements/nouveau" element={<NouvelAbonnementPage />} />
              <Route path="abonnements/:id/qrcode" element={<TicketQRCodePage />} />
              <Route path="billetterie" element={<AdminBilletteriePage />} />
              <Route path="voyages" element={<VoyagesPage />} />
              <Route path="profil" element={<ProfilePage />} />
            </Route>

            {/* Racine et anciennes routes à plat : redirigées vers l'espace du rôle courant */}
            <Route path="/" element={<RedirectionAccueil />} />
            <Route path="*" element={<RedirectionAccueil />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
