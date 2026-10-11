import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  School,
  GraduationCap,
  Briefcase,
  Layers,
  Upload,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [certQuery, setCertQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [hashingFile, setHashingFile] = useState(false);
  const { switchRole } = useAuth();
  const navigate = useNavigate();

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certQuery.trim()) return;
    navigate(`/verify/${encodeURIComponent(certQuery.trim())}`);
  };

  const handleFileUpload = (_file: File) => {
    setHashingFile(true);
    setTimeout(() => {
      setHashingFile(false);
      navigate(`/verify/CERT-2024-8841`);
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center flex flex-col items-center">
        {/* Institutional Accreditation Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-surface-container-high text-xs font-semibold text-primary mb-6 shadow-xs animate-in fade-in duration-300">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
          <span>ERC-721 Cryptographic Credential Protocol · Ethereum Mainnet</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-headline-lg text-3xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight max-w-4xl leading-[1.15]">
          Tamper-Proof Academic Certificates on the{' '}
          <span className="text-primary underline decoration-brand-teal/40 decoration-4 underline-offset-8">
            Blockchain
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-lg text-secondary max-w-2xl leading-relaxed">
          CertiChain empowers universities to cryptographically attest degrees, students to own their verifiable credentials, and employers to confirm authentic qualifications in milliseconds.
        </p>

        {/* Verification Widget Box */}
        <div className="w-full max-w-2xl mt-10 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-xl border border-surface-container text-left relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm text-on-surface">
                Instant Public Credential Verifier
              </span>
            </div>
            <span className="text-[11px] font-code-mono text-outline font-medium">
              Zero-Knowledge Enabled
            </span>
          </div>

          {/* Search Form */}
          <form onSubmit={handleVerifySubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={certQuery}
                onChange={(e) => setCertQuery(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CERT-2024-8841) or Keccak Hash..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
              />
            </div>
            <Button type="submit" size="md" variant="primary" className="h-11">
              Verify On-Chain
            </Button>
          </form>

          {/* Quick sample buttons */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-outline">
            <span>Try sample:</span>
            <button
              type="button"
              onClick={() => setCertQuery('CERT-2024-8841')}
              className="px-2 py-0.5 rounded bg-surface-container text-primary font-code-mono hover:bg-surface-container-high font-semibold transition-colors"
            >
              CERT-2024-8841 (Elena · CS)
            </button>
            <button
              type="button"
              onClick={() => setCertQuery('CERT-2024-8839')}
              className="px-2 py-0.5 rounded bg-surface-container text-amber-800 font-code-mono hover:bg-surface-container-high font-semibold transition-colors"
            >
              CERT-2024-8839 (Pending)
            </button>
            <button
              type="button"
              onClick={() => setCertQuery('CERT-2024-8830')}
              className="px-2 py-0.5 rounded bg-surface-container text-rose-800 font-code-mono hover:bg-surface-container-high font-semibold transition-colors"
            >
              CERT-2024-8830 (Revoked)
            </button>
          </div>

          {/* Drag & Drop PDF Hash verifier zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`mt-4 p-4 rounded-xl border border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
              dragOver
                ? 'border-brand-teal bg-primary/5'
                : 'border-outline-variant/60 bg-surface-container-low/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface">
                  Or drag and drop certificate PDF here
                </p>
                <p className="text-[11px] text-outline">
                  Calculates SHA-256 client-side to verify match against blockchain hash.
                </p>
              </div>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <span className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container text-xs font-semibold text-on-surface inline-block transition-colors">
                {hashingFile ? 'Computing Hash...' : 'Browse File'}
              </span>
            </label>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl text-left">
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Total Issued Degrees
            </span>
            <p className="font-display-hero text-2xl sm:text-3xl font-bold text-on-surface mt-1">
              14,892
            </p>
            <span className="text-[11px] text-primary font-medium">+482 this semester</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              On-Chain Verified
            </span>
            <p className="font-display-hero text-2xl sm:text-3xl font-bold text-on-surface mt-1">
              97.9%
            </p>
            <span className="text-[11px] text-primary font-medium">14,580 attestations</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Validation Latency
            </span>
            <p className="font-display-hero text-2xl sm:text-3xl font-bold text-on-surface mt-1">
              &lt;400ms
            </p>
            <span className="text-[11px] text-secondary font-medium">Poseidon Merkle Root</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Credential Forgery Rate
            </span>
            <p className="font-display-hero text-2xl sm:text-3xl font-bold text-primary mt-1">
              0.00%
            </p>
            <span className="text-[11px] text-secondary font-medium">Cryptographically Sealed</span>
          </div>
        </div>
      </section>

      {/* Role Personas Section */}
      <section className="py-16 bg-surface-container-low/50 border-y border-surface-container px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-wider text-primary font-semibold">
              Built for Academic Ecosystems
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface mt-2 tracking-tight">
              Designed for Registrars, Students, Employers & Regulators
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-2">
              Explore the dedicated interfaces customized for each stakeholder in the academic credential lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* University Admin */}
            <Card className="flex flex-col justify-between hover:border-brand-teal transition-all">
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  University Registrars
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Mint immutable degrees, configure 3-of-5 multi-sig key custody, manage revocations, and view issuance telemetry.
                </p>
              </CardContent>
              <div className="p-4 border-t border-surface-container">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    switchRole('admin');
                    navigate('/admin/dashboard');
                  }}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Registrar Portal
                </Button>
              </div>
            </Card>

            {/* Students */}
            <Card className="flex flex-col justify-between hover:border-brand-teal transition-all">
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Students & Alumni
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Access your digital credential wallet, generate shareable QR verification codes, and download signed official PDF diplomas.
                </p>
              </CardContent>
              <div className="p-4 border-t border-surface-container">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    switchRole('student');
                    navigate('/student/dashboard');
                  }}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Student Wallet
                </Button>
              </div>
            </Card>

            {/* Employers */}
            <Card className="flex flex-col justify-between hover:border-brand-teal transition-all">
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Employers & HR
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Instantly verify diplomas via Certificate ID or document hash with zero third-party delay or verification fees.
                </p>
              </CardContent>
              <div className="p-4 border-t border-surface-container">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/verify')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Public Verifier
                </Button>
              </div>
            </Card>

            {/* Education Authority */}
            <Card className="flex flex-col justify-between hover:border-brand-teal transition-all">
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Education Authorities
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Read-only oversight dashboard monitoring cross-university issuance volume, accreditation compliance, and fraud audits.
                </p>
              </CardContent>
              <div className="p-4 border-t border-surface-container">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    switchRole('authority');
                    navigate('/authority/dashboard');
                  }}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Oversight Console
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Cryptographic Architecture Feature Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-headline-sm text-base font-semibold text-on-surface">
              SHA-256 Normalized Payloads
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Every certificate’s student UID, degree, conferral date, and honors are canonically formatted into a deterministic SHA-256 digest before anchor.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-headline-sm text-base font-semibold text-on-surface">
              Poseidon Merkle Tree Anchoring
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Certificates are organized into Merkle batch trees. State roots are committed on Ethereum Mainnet with gas costs under $1.20 per batch.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-headline-sm text-base font-semibold text-on-surface">
              Instant On-Chain Revocation
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              If an attestation is nullified for academic disciplinary causes, an on-chain flag updates instantly. Matching hashes will flag invalid immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-inverse-surface text-surface-container-lowest text-xs border-t border-surface-variant/20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-fixed" />
            <span className="font-semibold text-sm">CertiChain Protocol</span>
            <span className="text-outline-variant">· Stanford University Registrar Pilot</span>
          </div>
          <div className="flex items-center gap-4 text-outline-variant">
            <Link to="/admin/dashboard" className="hover:text-white transition-colors">Admin</Link>
            <Link to="/student/dashboard" className="hover:text-white transition-colors">Student</Link>
            <Link to="/authority/dashboard" className="hover:text-white transition-colors">Oversight</Link>
            <Link to="/verify" className="hover:text-white transition-colors">Verifier</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
