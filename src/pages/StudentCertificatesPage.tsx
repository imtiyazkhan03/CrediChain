import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCertificates } from '../contexts/CertificateContext';
import { CertificateCard } from '../components/CertificateCard';
import type { Certificate } from '../types';
import { Search } from 'lucide-react';

interface StudentCertificatesPageProps {
  onInspect: (cert: Certificate) => void;
  onShowQR: (cert: Certificate) => void;
}

export const StudentCertificatesPage: React.FC<StudentCertificatesPageProps> = ({
  onInspect,
  onShowQR,
}) => {
  const { currentUser } = useAuth();
  const { certificates } = useCertificates();
  const [searchTerm, setSearchTerm] = useState('');

  // Show certificates matching current student or student's ID, fallback to available verified certs
  const myCerts = certificates.filter(
    (c) =>
      c.studentId === (currentUser.studentId || 'SU-2020-0492') ||
      c.studentName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      c.status === 'Verified'
  );

  const filtered = myCerts.filter(
    (c) =>
      c.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            My Credential Wallet
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Decentralized verifiable credentials anchored to your Ethereum DID address.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-code-mono text-xs font-semibold w-fit border border-surface-container-high">
          <span>Wallet DID: 0x78a1...49c1</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by degree title, department, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
          />
        </div>

        <span className="text-xs text-outline font-semibold">
          {filtered.length} Credentials Available
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cert) => (
          <CertificateCard
            key={cert.id}
            certificate={cert}
            onInspect={onInspect}
            onShowQR={onShowQR}
          />
        ))}
      </div>
    </div>
  );
};
