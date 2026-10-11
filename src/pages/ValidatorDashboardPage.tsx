import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCertificates } from '../contexts/CertificateContext';
import { computeSha256 } from '../services/hashService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { QRScannerModal } from '../components/QRScannerModal';
import type { Certificate } from '../types';
import {
  ShieldCheck,
  Search,
  QrCode,
  UploadCloud,
  FileCheck2,
  FileWarning,
  XCircle,
  Building2,
  Hash,
  LogOut,
} from 'lucide-react';

interface ValidatorDashboardPageProps {
  onInspect: (cert: Certificate) => void;
}

export const ValidatorDashboardPage: React.FC<ValidatorDashboardPageProps> = ({ onInspect }) => {
  const { currentUser, logout } = useAuth();
  const { certificates, verifyCertificate } = useCertificates();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [activeResult, setActiveResult] = useState<{
    cert: Certificate | null;
    outcome: 'idle' | 'verified' | 'altered' | 'revoked' | 'unknown';
    computedHash?: string;
  }>({
    cert: null,
    outcome: 'idle',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const res = verifyCertificate(query.trim());
    if (!res.certificate) {
      setActiveResult({ cert: null, outcome: 'unknown' });
    } else if (res.certificate.status === 'Revoked') {
      setActiveResult({ cert: res.certificate, outcome: 'revoked' });
    } else {
      setActiveResult({ cert: res.certificate, outcome: 'verified' });
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const hash = computeSha256(bytes);

      // Search if certificate ID is known or find by hash
      const cleanTarget = query.trim();
      const res = cleanTarget ? verifyCertificate(cleanTarget) : { certificate: null };

      if (res.certificate) {
        if (res.certificate.status === 'Revoked') {
          setActiveResult({ cert: res.certificate, outcome: 'revoked', computedHash: hash });
        } else {
          const expected = `0x${res.certificate.certHash}`.toLowerCase();
          if (hash.toLowerCase() === expected) {
            setActiveResult({ cert: res.certificate, outcome: 'verified', computedHash: hash });
          } else {
            setActiveResult({ cert: res.certificate, outcome: 'altered', computedHash: hash });
          }
        }
      } else {
        // Find certificate matching the hash directly
        const cleanHash = hash.toLowerCase().replace(/^0x/, '');
        const match = certificates.find((c) => c.certHash.toLowerCase() === cleanHash);
        if (match) {
          if (match.status === 'Revoked') {
            setActiveResult({ cert: match, outcome: 'revoked', computedHash: hash });
          } else {
            setActiveResult({ cert: match, outcome: 'verified', computedHash: hash });
          }
        } else {
          setActiveResult({ cert: null, outcome: 'unknown', computedHash: hash });
        }
      }
    } catch {
      setActiveResult({ cert: null, outcome: 'unknown' });
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Recruiter Credential Verification Console
            </h1>
            <Badge variant="verified" size="sm">
              Recruiter Portal
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Independent candidate credential screening & authentication environment for recruiters, talent scouts, and hiring managers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-code-mono text-xs font-semibold border border-surface-container-high">
            <span>{currentUser.institution || 'Google HR Global'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Registry Status
            </span>
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            Online & Synced
          </p>
          <span className="text-xs text-primary font-medium">Ethereum Sepolia (Chain 11155111)</span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Total Verifications
            </span>
            <Building2 className="w-5 h-5 text-secondary" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            1,482 Queries
          </p>
          <span className="text-xs text-secondary font-medium">99.8% Automated Success</span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Disciplinary Rescissions
            </span>
            <XCircle className="w-5 h-5 text-error" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            1 Revoked Record
          </p>
          <span className="text-xs text-error font-medium">Strict On-Chain Precedence</span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Public Privacy Level
            </span>
            <Hash className="w-5 h-5 text-amber-600" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            Zero PII Leak
          </p>
          <span className="text-xs text-amber-700 font-medium">Masked student data only</span>
        </div>
      </div>

      {/* Verification Query Card */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-xs flex flex-col gap-5">
        <h2 className="font-headline-sm text-base font-bold text-on-surface">
          Authenticate Candidate Diploma
        </h2>

        {/* Input & Action Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Certificate ID (e.g. CERT-2024-8841) or student name..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="h-11"
              onClick={() => setIsQRScannerOpen(true)}
              leftIcon={<QrCode className="w-4 h-4" />}
            >
              Scan QR
            </Button>
            <Button type="submit" variant="primary" size="md" className="h-11">
              Verify ID
            </Button>
          </div>
        </form>

        {/* File Drag and Drop Box */}
        <label
          htmlFor="validator-file-upload"
          className="border-2 border-dashed border-surface-container-high hover:border-primary rounded-xl p-6 text-center bg-surface-container-low/30 hover:bg-surface-container-low cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
        >
          <UploadCloud className="w-8 h-8 text-primary" />
          <span className="text-xs font-semibold text-on-surface">
            {uploadedFile ? `Uploaded: ${uploadedFile.name}` : 'Drop candidate PDF diploma to verify cryptographic byte integrity'}
          </span>
          <span className="text-[10px] text-outline">
            Computes exact SHA-256 byte digest and compares against immutable smart contract anchor
          </span>
          <input
            id="validator-file-upload"
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </label>

        {/* Verification Result Box */}
        {activeResult.outcome === 'verified' && activeResult.cert && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <FileCheck2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-emerald-900">
                      Cryptographically Authentic Academic Credential
                    </h3>
                    <Badge variant="verified" size="sm">
                      VERIFIED ON-CHAIN
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    Conferred Degree: <strong>{activeResult.cert.degree}</strong> ({activeResult.cert.department})
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 font-code-mono">
                    Conferral Date: {activeResult.cert.date} · Block #{activeResult.cert.blockNumber}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onInspect(activeResult.cert!)}
                className="shrink-0"
              >
                Inspect Parchment
              </Button>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs font-code-mono text-emerald-900 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-outline text-[10px] uppercase font-semibold">On-Chain SHA-256 Digest:</span>
                <span className="text-emerald-700 font-bold">100% MATCH</span>
              </div>
              <p className="break-all text-[11px] font-bold">
                0x{activeResult.cert.certHash}
              </p>
            </div>
          </div>
        )}

        {activeResult.outcome === 'altered' && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <FileWarning className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-rose-900">
                    Tampered / Altered Document Detected!
                  </h3>
                  <Badge variant="revoked" size="sm">
                    HASH MISMATCH
                  </Badge>
                </div>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  The computed SHA-256 hash of this uploaded document differs from the immutable on-chain record. Do not accept this qualification: grades, recipient name, or conferral details have been manipulated.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeResult.outcome === 'revoked' && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <XCircle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-rose-900">
                    Certificate Nullified & Revoked On-Chain
                  </h3>
                  <Badge variant="revoked" size="sm">
                    REVOKED
                  </Badge>
                </div>
                <p className="text-xs text-rose-800 mt-1">
                  This academic qualification was formally rescinded by university authorities.
                  {activeResult.cert?.revocationReason && ` Reason: ${activeResult.cert.revocationReason}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeResult.outcome === 'unknown' && (
          <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container text-on-surface flex items-center gap-3 animate-in fade-in">
            <XCircle className="w-7 h-7 text-outline shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-on-surface">No Registered Certificate Found</h3>
              <p className="text-xs text-secondary mt-0.5">
                The queried ID or uploaded document hash was not found in the Stanford University credential registry.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Verification History Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-xs overflow-hidden">
        <div className="p-4 border-b border-surface-container flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface">
              Recent Institutional Credentials Ledger
            </h3>
            <p className="text-xs text-secondary">
              Direct access to live verification anchors
            </p>
          </div>
          <span className="text-xs text-outline font-code-mono">
            {certificates.length} Total Records
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low text-outline font-semibold uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Degree & Faculty</th>
                <th className="py-3 px-4">Conferral Date</th>
                <th className="py-3 px-4">On-Chain Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {certificates.slice(0, 5).map((cert) => (
                <tr key={cert.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-4 font-code-mono font-semibold text-on-surface">
                    {cert.id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-on-surface block">{cert.degree}</span>
                    <span className="text-[11px] text-secondary">{cert.department}</span>
                  </td>
                  <td className="py-3 px-4 text-secondary">{cert.date}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={cert.status === 'Verified' ? 'verified' : 'revoked'}
                      size="sm"
                    >
                      {cert.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setQuery(cert.id);
                        const res = verifyCertificate(cert.id);
                        setActiveResult({
                          cert: res.certificate,
                          outcome: res.certificate?.status === 'Revoked' ? 'revoked' : 'verified',
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-container text-primary font-semibold hover:bg-surface-container-high transition-colors"
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={(scannedId) => {
          setQuery(scannedId);
          const res = verifyCertificate(scannedId);
          if (!res.certificate) {
            setActiveResult({ cert: null, outcome: 'unknown' });
          } else if (res.certificate.status === 'Revoked') {
            setActiveResult({ cert: res.certificate, outcome: 'revoked' });
          } else {
            setActiveResult({ cert: res.certificate, outcome: 'verified' });
          }
        }}
      />
    </div>
  );
};
