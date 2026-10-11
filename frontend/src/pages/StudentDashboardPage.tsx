import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCertificates } from '../contexts/CertificateContext';
import { CertificateCard } from '../components/CertificateCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Certificate } from '../types';
import {
  Wallet,
  ShieldCheck,
  QrCode,
  Share2,
  Award,
  ArrowRight,
} from 'lucide-react';

interface StudentDashboardPageProps {
  onInspect: (cert: Certificate) => void;
  onShowQR: (cert: Certificate) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onInspect,
  onShowQR,
}) => {
  const { currentUser } = useAuth();
  const { certificates } = useCertificates();
  const navigate = useNavigate();

  // Find certificates belonging to Elena Rostova or matching studentId
  const studentCerts = certificates.filter(
    (c) =>
      c.studentId === (currentUser.studentId || 'SU-2020-0492') ||
      c.studentName.toLowerCase().includes(currentUser.name.toLowerCase())
  );

  const primaryCert = studentCerts[0] || certificates[0];

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Student Welcome Card */}
      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                Welcome, {currentUser.name}
              </h1>
              <Badge variant="verified" size="sm">
                Alumna
              </Badge>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Matriculation UID: <strong className="font-code-mono text-on-surface">{currentUser.studentId || 'SU-2020-0492'}</strong> · Stanford University School of Engineering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShowQR(primaryCert)}
            leftIcon={<QrCode className="w-4 h-4" />}
          >
            My QR Pass
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/student/certificates')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Credential Wallet
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Degrees in Wallet
            </span>
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            {studentCerts.length} Credential
          </p>
          <span className="text-xs text-primary font-medium">100% Cryptographically Verified</span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Employer Queries
            </span>
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            12 Queries
          </p>
          <span className="text-xs text-secondary">Verified by Google, McKinsey & MIT</span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Student DID Address
            </span>
            <Award className="w-5 h-5 text-amber-700" />
          </div>
          <p className="font-code-mono text-sm font-bold text-on-surface mt-2 truncate">
            0x78a1...49c1
          </p>
          <span className="text-xs text-primary font-medium">Ethereum Attested DID</span>
        </div>
      </div>

      {/* Primary Degree Showcase */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline-sm text-base font-semibold text-on-surface">
            Primary Degree Attestation
          </h2>
          <Link
            to="/student/certificates"
            className="text-xs text-primary hover:underline font-semibold"
          >
            View All in Wallet →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {primaryCert && (
            <CertificateCard
              certificate={primaryCert}
              onInspect={onInspect}
              onShowQR={onShowQR}
            />
          )}

          {/* Quick Sharing & Verification Details */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-container">
              <Share2 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-on-surface">One-Click Resume & LinkedIn Sharing</span>
            </div>

            <p className="text-secondary leading-relaxed">
              Add your tamper-evident degree to LinkedIn, resume PDFs, or job applications with an instant zero-knowledge verification deep link.
            </p>

            <div className="p-3 rounded-lg bg-surface-container-low font-code-mono text-[11px] text-on-surface break-all border border-surface-container">
              {`${window.location.origin}/verify/${primaryCert?.id || 'CERT-2024-8841'}`}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/verify/${primaryCert?.id || 'CERT-2024-8841'}`);
                  alert('Verification link copied to clipboard!');
                }}
                className="flex-1"
              >
                Copy Link
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => primaryCert && onInspect(primaryCert)}
                className="flex-1"
              >
                Download Diploma
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
