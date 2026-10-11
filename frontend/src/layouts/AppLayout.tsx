import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { CertificateInspectModal } from '../components/CertificateInspectModal';
import { RevokeModal } from '../components/RevokeModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { TransactionStatusModal } from '../components/TransactionStatusModal';
import { useCertificates } from '../contexts/CertificateContext';
import type { Certificate } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
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

  const isPublicStandalone = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showSidebarToggle={!isPublicStandalone}
      />

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
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
          {children}
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

      {/* Web3 Transaction Status Modal */}
      <TransactionStatusModal />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-inverse-surface text-surface-container-lowest text-xs rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <span className="material-symbols-outlined text-primary text-base">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
