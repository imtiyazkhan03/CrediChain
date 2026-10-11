import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Certificate, ActivityEvent } from '../types';
import { INITIAL_CERTIFICATES, LIVE_ACTIVITY_STREAM } from '../data/mockData';

interface CertificateContextType {
  certificates: Certificate[];
  activityStream: ActivityEvent[];
  selectedCertificate: Certificate | null;
  setSelectedCertificate: (cert: Certificate | null) => void;
  issueCertificate: (cert: Certificate) => void;
  revokeCertificate: (certId: string, reason: string) => void;
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
        return JSON.parse(saved);
      } catch {
        return INITIAL_CERTIFICATES;
      }
    }
    return INITIAL_CERTIFICATES;
  });

  const [activityStream, setActivityStream] = useState<ActivityEvent[]>(LIVE_ACTIVITY_STREAM);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('certichain_certificates', JSON.stringify(certificates));
  }, [certificates]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const issueCertificate = (newCert: Certificate) => {
    setCertificates((prev) => [newCert, ...prev]);

    // Record on-chain event
    const newEvent: ActivityEvent = {
      id: `evt-${Date.now()}`,
      type: 'batch_mint',
      title: `Credential Minted: ${newCert.id}`,
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
    showToast(`Degree attestation for ${newCert.studentName} (${newCert.id}) minted successfully!`);
  };

  const revokeCertificate = (certId: string, reason: string) => {
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
      title: `Certificate Nullified: ${certId}`,
      description: `Revocation executed on Ethereum Mainnet. Reason: ${reason}`,
      timeAgo: 'Just now',
      status: 'Revoked',
      subText: 'Disciplinary Nonce Logged',
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
