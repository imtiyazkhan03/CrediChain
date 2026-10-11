import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  Search,
  School,
  Upload,
  CheckCircle,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [certQuery, setCertQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certQuery.trim()) return;
    navigate(`/verify/${encodeURIComponent(certQuery.trim())}`);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    // Compute SHA-256 in browser and navigate to verify
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      navigate(`/verify?hash=${hashHex}`);
    } catch {
      navigate('/verify');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
        {/* Accreditation Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-surface-container-high text-xs font-semibold text-primary mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Blockchain-Backed Academic Credential Verification</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-headline-lg text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight max-w-3xl leading-tight">
          Tamper-Proof Academic Certificates
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base text-secondary max-w-xl leading-relaxed">
          CertiChain provides genuine cryptographic diploma verification built for three stakeholders: 
          <span className="font-semibold text-on-surface"> Colleges</span> issue credentials, 
          <span className="font-semibold text-on-surface"> Students</span> own their credentials, and 
          <span className="font-semibold text-on-surface"> Recruiters</span> verify authenticity in seconds.
        </p>

        {/* Main Clean Verification Card */}
        <div className="w-full max-w-xl mt-8 bg-surface-container-lowest p-6 rounded-2xl shadow-md border border-surface-container text-left">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm text-on-surface">
                Verify Any Certificate Instantly
              </span>
            </div>
            <span className="text-[11px] text-outline font-medium">Public & Free</span>
          </div>

          {/* Search Form */}
          <form onSubmit={handleVerifySubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={certQuery}
                onChange={(e) => setCertQuery(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CERT-2024-8841)..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
              />
            </div>
            <Button type="submit" size="md" variant="primary" className="h-11">
              Verify
            </Button>
          </form>

          {/* Drag & Drop File Verification Zone */}
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
                : 'border-surface-container-highest bg-surface-container-low/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface">
                  Or drop certificate PDF here
                </p>
                <p className="text-[11px] text-outline">
                  Calculates SHA-256 byte digest to detect tampering.
                </p>
              </div>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <span className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container text-xs font-semibold text-on-surface inline-block transition-colors">
                Browse PDF
              </span>
            </label>
          </div>
        </div>

        {/* 3 People Portal Quick Access Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Link to="/admin/dashboard">
            <Button variant="outline" size="sm" leftIcon={<School className="w-3.5 h-3.5 text-primary" />}>
              College Portal
            </Button>
          </Link>
          <Link to="/student/dashboard">
            <Button variant="outline" size="sm" leftIcon={<CheckCircle className="w-3.5 h-3.5 text-secondary" />}>
              Student Portal
            </Button>
          </Link>
          <Link to="/recruiter/dashboard">
            <Button variant="outline" size="sm" leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}>
              Recruiter Console
            </Button>
          </Link>
        </div>
      </section>

      {/* Simplified 3-Stakeholder Section */}
      <section className="py-14 bg-surface-container-low/40 border-t border-surface-container px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              Designed for 3 Ecosystem Roles
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              A unified trust layer connecting Colleges, Students, and Recruiters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Persona 1: College */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3 shadow-xs hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <School className="w-5 h-5" />
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                1. College / University
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Registrars issue verifiable PDF degrees, anchor SHA-256 cryptographic hashes onto the blockchain ledger, and manage instant disciplinary degree revocations.
              </p>
              <Link to="/admin/dashboard" className="text-xs font-semibold text-primary hover:underline mt-auto pt-2 flex items-center gap-1">
                Enter College Portal →
              </Link>
            </div>

            {/* Persona 2: Student */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3 shadow-xs hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                2. Student / Alumna
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Graduates own their personal academic wallet, download authentic vector PDF diplomas, inspect on-chain block receipts, and share dynamic verification QR codes.
              </p>
              <Link to="/student/dashboard" className="text-xs font-semibold text-primary hover:underline mt-auto pt-2 flex items-center gap-1">
                Enter Student Portal →
              </Link>
            </div>

            {/* Persona 3: Recruiter */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3 shadow-xs hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                3. Recruiter / Employer
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Talent recruiters authenticate candidate diplomas in milliseconds via ID search, drag-and-drop PDF byte comparison, or camera QR scanning with zero student PII leaks.
              </p>
              <Link to="/recruiter/dashboard" className="text-xs font-semibold text-primary hover:underline mt-auto pt-2 flex items-center gap-1">
                Enter Recruiter Console →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-inverse-surface text-surface-container-lowest text-xs border-t border-surface-variant/20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-fixed" />
            <span className="font-semibold">CertiChain</span>
            <span className="text-outline-variant">· College, Student & Recruiter Credential Registry</span>
          </div>
          <div className="flex items-center gap-4 text-outline-variant">
            <Link to="/login" className="hover:text-white transition-colors">Portal Login</Link>
            <Link to="/admin/dashboard" className="hover:text-white transition-colors">College</Link>
            <Link to="/student/dashboard" className="hover:text-white transition-colors">Student</Link>
            <Link to="/recruiter/dashboard" className="hover:text-white transition-colors">Recruiter</Link>
            <Link to="/verify" className="hover:text-white transition-colors">Public Verifier</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
