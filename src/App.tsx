import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import { CertificateProvider, useCertificates } from './contexts/CertificateContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminCertificatesPage } from './pages/AdminCertificatesPage';
import { AdminIssuePage } from './pages/AdminIssuePage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { StudentCertificatesPage } from './pages/StudentCertificatesPage';
import { PublicVerifyPage } from './pages/PublicVerifyPage';
import { ValidatorDashboardPage } from './pages/ValidatorDashboardPage';
import { CertificateInspectModal } from './components/CertificateInspectModal';
import { RevokeModal } from './components/RevokeModal';
import { QRCodeModal } from './components/QRCodeModal';
import { TransactionStatusModal } from './components/TransactionStatusModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import type { Certificate } from './types';
import { ShieldCheck } from 'lucide-react';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const {
    selectedCertificate,
    setSelectedCertificate,
    revokeCertificate,
    toastMessage,
  } = useCertificates();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [certToRevoke, setCertToRevoke] = useState<Certificate | null>(null);
  const [certForQR, setCertForQR] = useState<Certificate | null>(null);

  // Landing page, login, and public verification have full-bleed layout without the persistent sidebar
  const isPublicStandalone = location.pathname === '/' || location.pathname === '/login' || location.pathname.startsWith('/verify');

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showSidebarToggle={!isPublicStandalone}
      />

      <div className="flex flex-1 pt-16">
        {/* Sidebar only shown on authenticated/dashboard routes */}
        {!isPublicStandalone && (
          <Sidebar
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all w-full min-h-[calc(100vh-4rem)] ${
            !isPublicStandalone ? 'lg:pl-64 p-4 sm:p-6 lg:p-8' : ''
          }`}
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Admin Routes - Protected */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'university_admin']}>
                  <AdminDashboardPage
                    onInspect={(c) => setSelectedCertificate(c)}
                    onRevoke={(c) => setCertToRevoke(c)}
                    onShowQR={(c) => setCertForQR(c)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificates"
              element={
                <ProtectedRoute allowedRoles={['admin', 'university_admin']}>
                  <AdminCertificatesPage
                    onInspect={(c) => setSelectedCertificate(c)}
                    onRevoke={(c) => setCertToRevoke(c)}
                    onShowQR={(c) => setCertForQR(c)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/issue"
              element={
                <ProtectedRoute allowedRoles={['admin', 'university_admin']}>
                  <AdminIssuePage onInspect={(c) => setSelectedCertificate(c)} />
                </ProtectedRoute>
              }
            />

            {/* Student Routes - Protected */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboardPage
                    onInspect={(c) => setSelectedCertificate(c)}
                    onShowQR={(c) => setCertForQR(c)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/certificates"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentCertificatesPage
                    onInspect={(c) => setSelectedCertificate(c)}
                    onShowQR={(c) => setCertForQR(c)}
                  />
                </ProtectedRoute>
              }
            />

            {/* Verification Routes - Public */}
            <Route
              path="/verify"
              element={<PublicVerifyPage onInspect={(c) => setSelectedCertificate(c)} />}
            />
            <Route
              path="/verify/:certificateId"
              element={<PublicVerifyPage onInspect={(c) => setSelectedCertificate(c)} />}
            />

            {/* Recruiter / Employer Routes - Protected */}
            <Route
              path="/recruiter/dashboard"
              element={
                <ProtectedRoute allowedRoles={['validator', 'verifier']}>
                  <ValidatorDashboardPage onInspect={(c) => setSelectedCertificate(c)} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/validator/dashboard"
              element={
                <ProtectedRoute allowedRoles={['validator', 'verifier']}>
                  <ValidatorDashboardPage onInspect={(c) => setSelectedCertificate(c)} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority/dashboard"
              element={
                <ProtectedRoute allowedRoles={['validator', 'verifier', 'authority']}>
                  <ValidatorDashboardPage onInspect={(c) => setSelectedCertificate(c)} />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>
      </div>

      {/* Flagship Official Parchment Modal */}
      <CertificateInspectModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
      />

      {/* Revocation Confirmation Modal */}
      <RevokeModal
        certificate={certToRevoke}
        isOpen={Boolean(certToRevoke)}
        onClose={() => setCertToRevoke(null)}
        onConfirmRevoke={(certId, reason) => revokeCertificate(certId, reason)}
      />

      {/* Shareable QR Code Modal */}
      <QRCodeModal certificate={certForQR} onClose={() => setCertForQR(null)} />

      {/* On-Chain Transaction Status Modal */}
      <TransactionStatusModal />

      {/* Global Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-surface-container-lowest px-4 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2.5 animate-in slide-in-from-bottom-3">
          <ShieldCheck className="w-4 h-4 text-primary-fixed" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Web3Provider>
          <CertificateProvider>
            <AppLayout />
          </CertificateProvider>
        </Web3Provider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
