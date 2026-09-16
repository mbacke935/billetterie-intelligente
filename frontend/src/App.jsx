import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import './index.css';

// Chaque page est chargée à la demande (code-splitting) plutôt que regroupée dans
// un seul gros bundle initial : ScanTicketPage (html5-qrcode) et TicketQRCodePage
// (qrcode.react) notamment n'ont pas besoin d'être téléchargées avant d'être visitées.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChangerMotDePassePage = lazy(() => import('./pages/ChangerMotDePassePage'));
const AbonnementsPage = lazy(() => import('./pages/AbonnementsPage'));
const NouvelAbonnementPage = lazy(() => import('./pages/NouvelAbonnementPage'));
const VoyagesPage = lazy(() => import('./pages/VoyagesPage'));
const TicketQRCodePage = lazy(() => import('./pages/TicketQRCodePage'));
const ScanTicketPage = lazy(() => import('./pages/ScanTicketPage'));

// Layout principal avec navbar + sidebar
const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Navbar />
    <div className="app-body">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  </div>
);

const PageFallback = () => (
  <div className="page-loading">
    <div className="loading-spinner" />
  </div>
);

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<LoginPage />} />


            {/* Routes protégées */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/utilisateurs"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UsersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Anciennes pages (Admins/Agents/Clients) fusionnées dans /utilisateurs */}
            <Route path="/admins" element={<Navigate to="/utilisateurs" replace />} />
            <Route path="/agents" element={<Navigate to="/utilisateurs" replace />} />
            <Route path="/clients" element={<Navigate to="/utilisateurs" replace />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/changer-mot-de-passe"
              element={
                <ProtectedRoute>
                  <ChangerMotDePassePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/abonnements"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AbonnementsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/abonnements/nouveau"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <NouvelAbonnementPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/voyages"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <VoyagesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/abonnements/:id/qrcode"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TicketQRCodePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scan"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ScanTicketPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
