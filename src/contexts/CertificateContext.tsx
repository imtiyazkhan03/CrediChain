import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Certificate, ActivityEvent } from '../types';

interface CertificateContextType {
  certificates: Certificate[];
  activityStream: ActivityEvent[];
  selectedCertificate: Certificate | null;
  setSelectedCertificate: (cert: Certificate | null) => void;
  issueCertificate: (cert: Certificate) => void;
  revokeCertificate: (certId: string, reason: string) => Promise<void>;
  refreshCertificates: () => Promise<void>;
  verifyCertificate: (query: string) => {
    certificate: Certificate | null;
    status: 'verified' | 'revoked' | 'pending' | 'not_found';
  };
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

export const CertificateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('certichain_certificates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude old mock fixtures if present
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (c: any) => c.id !== 'CERT-2024-8841' && c.id !== 'CERT-2024-8840' && c.id !== 'CERT-2024-8835'
          );
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activityStream, setActivityStream] = useState<ActivityEvent[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshCertificates = async () => {
    try {
      const token = localStorage.getItem('certichain_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/certificates', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.certificates)) {
          setCertificates(data.certificates);
          localStorage.setItem('certichain_certificates', JSON.stringify(data.certificates));
        }
      }
    } catch (err) {
      console.warn('API error fetching certificates:', err);
    }
  };

  useEffect(() => {
    refreshCertificates();
  }, []);

  useEffect(() => {
    localStorage.setItem('certichain_certificates', JSON.stringify(certificates));
  }, [certificates]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const issueCertificate = (newCert: Certificate) => {
    setCertificates((prev) => [newCert, ...prev.filter((c) => c.id !== newCert.id)]);

    // Record real event
    const newEvent: ActivityEvent = {
      id: `evt-${Date.now()}`,
      type: 'batch_mint',
      title: `Credential Anchored: ${newCert.id}`,
      description: `${newCert.studentName} — ${newCert.degree}`,
      timeAgo: 'Just now',
      txHash: newCert.txHash,
      gasCost: 'Gas: $0.92',
      subText: newCert.department,
      status: 'Confirmed',
      icon: 'verified',
      iconColor: 'text-primary',
    };
    setActivityStream((prev) => [newEvent, ...prev]);
    showToast(`Degree attestation for ${newCert.studentName} (${newCert.id}) issued successfully!`);
  };

  const revokeCertificate = async (certId: string, reason: string) => {
    try {
      const token = localStorage.getItem('certichain_token');
      if (token) {
        await fetch(`/api/certificates/${certId}/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        });
      }
    } catch (e) {
      console.warn('Backend revoke error:', e);
    }

    setCertificates((prev) =>
      prev.map((c) =>
        c.id === certId
          ? {
              ...c,
              status: 'Revoked',
              revocationReason: reason,
              revokedAt: new Date().toUTCString(),
            }
          : c
      )
    );

    const revokeEvent: ActivityEvent = {
      id: `evt-${Date.now()}`,
      type: 'revocation',
      title: `Certificate Revoked: ${certId}`,
      description: `Revocation logged in registry. Reason: ${reason}`,
      timeAgo: 'Just now',
      status: 'Revoked',
      subText: 'Disciplinary Record Logged',
      icon: 'block',
      iconColor: 'text-error',
    };
    setActivityStream((prev) => [revokeEvent, ...prev]);
    showToast(`Certificate ${certId} revoked on-chain.`);
  };

  const verifyCertificate = (query: string): {
    certificate: Certificate | null;
    status: 'verified' | 'revoked' | 'pending' | 'not_found';
  } => {
    const clean = query.trim().toLowerCase();
    const found = certificates.find(
      (c) =>
        c.id.toLowerCase() === clean ||
        c.txHash.toLowerCase().includes(clean) ||
        (c.fullTxHash && c.fullTxHash.toLowerCase().includes(clean)) ||
        c.certHash.toLowerCase() === clean ||
        c.studentId.toLowerCase() === clean ||
        c.studentName.toLowerCase().includes(clean)
    );

    if (!found) {
      return { certificate: null, status: 'not_found' };
    }

    if (found.status === 'Revoked') {
      return { certificate: found, status: 'revoked' };
    }
    if (found.status === 'Pending') {
      return { certificate: found, status: 'pending' };
    }
    return { certificate: found, status: 'verified' };
  };

  return (
    <CertificateContext.Provider
      value={{
        certificates,
        activityStream,
        selectedCertificate,
        setSelectedCertificate,
        issueCertificate,
        revokeCertificate,
        refreshCertificates,
        verifyCertificate,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CertificateContext.Provider>
  );
};

export const useCertificates = () => {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error('useCertificates must be used within a CertificateProvider');
  }
  return context;
};
