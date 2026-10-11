import React, { useState } from 'react';
import { useCertificates } from '../contexts/CertificateContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { VERIFICATION_LOGS } from '../data/mockData';
import type { Certificate } from '../types';
import {
  Building2,
  FileCheck,
  ShieldAlert,
  Eye,
  Layers,
} from 'lucide-react';

interface AuthorityDashboardPageProps {
  onInspect: (cert: Certificate) => void;
}

export const AuthorityDashboardPage: React.FC<AuthorityDashboardPageProps> = ({ onInspect }) => {
  const { certificates } = useCertificates();
  const [activeTab, setActiveTab] = useState<'audits' | 'revocations'>('audits');

  const revokedCerts = certificates.filter((c) => c.status === 'Revoked');

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Educational Authority & Accreditation Oversight
            </h1>
            <Badge variant="gold" size="sm">
              Read-Only Audit
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Independent oversight console for Ministry of Higher Education & Accreditation Boards.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-code-mono text-xs font-semibold w-fit border border-surface-container-high">
          <span>Authority Key: 0x11a...39de (CHEA Oversight)</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Accredited Universities
            </span>
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            6 Universities
          </p>
          <span className="text-xs text-primary font-medium">Stanford, MIT, Berkeley, Harvard...</span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Total Degrees Anchored
            </span>
            <FileCheck className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            84,290
          </p>
          <span className="text-xs text-secondary">Cross-institutional consensus</span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Merkle Root Epochs
            </span>
            <Layers className="w-5 h-5 text-indigo-700" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-on-surface mt-2">
            1,420 Epochs
          </p>
          <span className="text-xs text-secondary">Poseidon Zero-Knowledge proof</span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Disciplinary Revocations
            </span>
            <ShieldAlert className="w-5 h-5 text-error" />
          </div>
          <p className="font-display-hero text-2xl font-bold text-error mt-2">
            {revokedCerts.length + 33} Flagged
          </p>
          <span className="text-xs text-outline">Nullification nonces verified</span>
        </div>
      </div>

      {/* Cross-Institutional Accreditation Status */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-xs p-5 flex flex-col gap-4">
        <h3 className="font-headline-sm text-base font-semibold text-on-surface">
          Institutional Node Registry & Smart Contract Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span>Stanford University</span>
              <Badge variant="verified" size="sm">Active Node</Badge>
            </div>
            <span className="text-outline font-code-mono text-[11px]">Contract: 0x71C...49A2</span>
            <div className="flex justify-between text-secondary pt-1 border-t border-surface-container mt-1">
              <span>Total Issued: 14,892</span>
              <span className="text-primary font-semibold">Quorum: 3-of-5</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span>MIT Registrar</span>
              <Badge variant="verified" size="sm">Active Node</Badge>
            </div>
            <span className="text-outline font-code-mono text-[11px]">Contract: 0x93F...110C</span>
            <div className="flex justify-between text-secondary pt-1 border-t border-surface-container mt-1">
              <span>Total Issued: 21,402</span>
              <span className="text-primary font-semibold">Quorum: 4-of-7</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span>UC Berkeley Office of Registrar</span>
              <Badge variant="verified" size="sm">Active Node</Badge>
            </div>
            <span className="text-outline font-code-mono text-[11px]">Contract: 0x24B...993D</span>
            <div className="flex justify-between text-secondary pt-1 border-t border-surface-container mt-1">
              <span>Total Issued: 18,910</span>
              <span className="text-primary font-semibold">Quorum: 3-of-5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Tabs */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-xs overflow-hidden">
        <div className="p-4 border-b border-surface-container flex items-center justify-between gap-4">
          <div className="inline-flex p-1 rounded-lg bg-surface-container-low text-xs">
            <button
              onClick={() => setActiveTab('audits')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeTab === 'audits'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Third-Party Query Audits
            </button>
            <button
              onClick={() => setActiveTab('revocations')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeTab === 'revocations'
                  ? 'bg-surface-container-lowest text-error shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Disciplinary Revocation Log ({revokedCerts.length})
            </button>
          </div>

          <span className="text-xs font-code-mono text-outline">
            Authority Read-Only Access
          </span>
        </div>

        {activeTab === 'audits' && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low text-outline font-semibold uppercase tracking-wider border-b border-surface-container">
                  <th className="py-3 px-4">Verifier / Organization</th>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Verification Scheme</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {VERIFICATION_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-on-surface block">{log.verifier}</span>
                      <span className="text-[11px] text-outline">{log.location}</span>
                    </td>
                    <td className="py-3 px-4 font-code-mono font-semibold text-primary">
                      {log.certId}
                    </td>
                    <td className="py-3 px-4 text-on-surface">
                      {log.studentName}
                    </td>
                    <td className="py-3 px-4 text-secondary">
                      {log.method}
                    </td>
                    <td className="py-3 px-4 font-code-mono text-outline">
                      {log.latency}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={log.result === 'Valid' ? 'verified' : 'revoked'} size="sm">
                        {log.result}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'revocations' && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low text-outline font-semibold uppercase tracking-wider border-b border-surface-container">
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Degree Revoked</th>
                  <th className="py-3 px-4">Revocation Reason</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {revokedCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3 px-4 font-code-mono font-semibold text-error">
                      {cert.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-surface">
                      {cert.studentName}
                    </td>
                    <td className="py-3 px-4 text-secondary truncate max-w-xs">
                      {cert.degree}
                    </td>
                    <td className="py-3 px-4 text-error font-medium">
                      {cert.revocationReason || 'Disciplinary sanction confirmed by Academic Senate.'}
                    </td>
                    <td className="py-3 px-4 text-outline text-[11px]">
                      {cert.revokedAt || 'Mar 11, 2024'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onInspect(cert)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
