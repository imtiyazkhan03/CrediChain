import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCertificates } from '../contexts/CertificateContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SIGNERS_LIST } from '../data/mockData';
import type { Certificate } from '../types';
import {
  PlusCircle,
  FileDown,
  QrCode,
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Copy,
  Eye,
  Trash2,
  Key,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onInspect: (cert: Certificate) => void;
  onRevoke: (cert: Certificate) => void;
  onShowQR: (cert: Certificate) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onInspect,
  onRevoke,
  onShowQR,
}) => {
  const { certificates, activityStream } = useCertificates();
  const [statusFilter, setStatusFilter] = useState<'All' | 'Verified' | 'Pending' | 'Revoked'>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7D' | '30D' | '90D' | 'AY'>('30D');
  const [networkTab, setNetworkTab] = useState<'Mainnet' | 'Polygon'>('Mainnet');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const navigate = useNavigate();

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const filteredCerts = certificates.filter((c) => {
    if (statusFilter === 'All') return true;
    return c.status === statusFilter;
  });

  const handleExportCSV = () => {
    const headers = 'Certificate ID,Student Name,Student ID,Degree,Department,Honors,Block,Status,Hash\n';
    const rows = certificates
      .map(
        (c) =>
          `"${c.id}","${c.studentName}","${c.studentId}","${c.degree}","${c.department}","${c.honors || 'N/A'}","${c.blockNumber}","${c.status}","${c.txHash}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CertiChain_Registry_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Page Header & Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Registrar Credential Dashboard
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-xs shadow-xs border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Contract: 0x71C...49A2</span>
              <span className="text-outline text-[11px]">(ERC-721 Accredited)</span>
            </div>
            <Badge variant="verified" size="sm">
              Sync: 12s ago
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Monitor cryptographic attestations, issuance batches, student credential verification, and on-chain validity across all faculties.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileDown className="w-4 h-4 text-secondary" />}
          >
            Export CSV / Audit
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/verify')}
            leftIcon={<QrCode className="w-4 h-4 text-primary" />}
          >
            Verify Document Hash
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/issue')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Issue Certificate
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Issued */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
                Total Certificates Issued
              </span>
              <p className="font-display-hero text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                {certificates.length + 14886}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-surface-container text-primary">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
            <span>+482 this semester</span>
            <span className="text-outline text-[11px]">(+3.4%)</span>
          </div>
        </div>

        {/* Verified On-Chain */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
                  Verified On-Chain
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-primary font-code-mono text-[10px] font-bold">
                  97.9%
                </span>
              </div>
              <p className="font-display-hero text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                14,580
              </p>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-highest text-primary">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
            <span>+1,240 verifications this month</span>
          </div>
        </div>

        {/* Pending Consensus */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
                Pending Batch Consensus
              </span>
              <p className="font-display-hero text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                278
              </p>
            </div>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3 flex items-center gap-1.5 text-xs text-amber-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>3 Batches Queued · Epoch 412</span>
          </div>
        </div>

        {/* Revoked */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
                  Revoked / Nullified
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-secondary font-code-mono text-[10px] font-bold">
                  0.2%
                </span>
              </div>
              <p className="font-display-hero text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                {certificates.filter((c) => c.status === 'Revoked').length + 33}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3 flex items-center gap-1 text-xs text-secondary font-medium">
            <span>Audit trail permanently sealed</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Volume Chart & Recent Certificates Table */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Chart Section */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-xl border border-surface-container shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                  Credential Issuance & Verification Volume
                </h3>
                <p className="text-xs text-secondary">
                  Cryptographic mints versus external ZK credential requests
                </p>
              </div>

              <div className="inline-flex p-1 rounded-lg bg-surface-container-low border border-surface-container text-xs self-start">
                {(['7D', '30D', '90D', 'AY'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTimeframe(t)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedTimeframe === t
                        ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    {t === 'AY' ? 'AY 2023-24' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric telemetry strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-surface-container-low border border-surface-container text-xs">
              <div>
                <span className="text-[11px] text-outline block">Avg. Mint Cost</span>
                <span className="font-code-mono font-semibold text-on-surface">
                  0.0014 ETH ($4.18)
                </span>
              </div>
              <div>
                <span className="text-[11px] text-outline block">Instant Validation Rate</span>
                <span className="font-code-mono font-semibold text-on-surface">
                  99.4% (&lt;850ms)
                </span>
              </div>
              <div>
                <span className="text-[11px] text-outline block">Ledger Proof Scheme</span>
                <span className="font-code-mono font-semibold text-on-surface">
                  Merkle Tree v2 + Poseidon
                </span>
              </div>
            </div>

            {/* Clean Vector SVG Chart */}
            <div className="relative w-full h-56 flex flex-col justify-end pt-4">
              <div className="absolute top-0 right-0 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-on-surface font-medium">Issued Degrees (Mints)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                  <span className="text-on-surface font-medium">Verifications</span>
                </div>
              </div>

              <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 180">
                <line className="text-surface-container" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="700" y1="20" y2="20" />
                <line className="text-surface-container" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="700" y1="70" y2="70" />
                <line className="text-surface-container" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="700" y1="120" y2="120" />
                <line className="text-surface-container" stroke="currentColor" strokeWidth="1" x1="0" x2="700" y1="160" y2="160" />

                <rect className="fill-primary" height="75" rx="4" width="22" x="25" y="85" />
                <rect className="fill-secondary-container" height="50" rx="4" width="22" x="52" y="110" />

                <rect className="fill-primary" height="110" rx="4" width="22" x="110" y="50" />
                <rect className="fill-secondary-container" height="85" rx="4" width="22" x="137" y="75" />

                <rect className="fill-primary" height="95" rx="4" width="22" x="195" y="65" />
                <rect className="fill-secondary-container" height="70" rx="4" width="22" x="222" y="90" />

                <rect className="fill-primary" height="80" rx="4" width="22" x="280" y="80" />
                <rect className="fill-secondary-container" height="105" rx="4" width="22" x="307" y="55" />

                <rect className="fill-primary" height="135" rx="4" width="22" x="365" y="25" />
                <rect className="fill-secondary-container" height="115" rx="4" width="22" x="392" y="45" />

                <rect className="fill-primary" height="70" rx="4" width="22" x="450" y="90" />
                <rect className="fill-secondary-container" height="95" rx="4" width="22" x="477" y="65" />

                <rect className="fill-primary" height="85" rx="4" width="22" x="535" y="75" />
                <rect className="fill-secondary-container" height="100" rx="4" width="22" x="562" y="60" />

                <rect className="fill-primary" height="125" rx="4" width="22" x="620" y="35" />
                <rect className="fill-secondary-container" height="135" rx="4" width="22" x="647" y="25" />
              </svg>

              <div className="flex justify-between items-center px-4 pt-2 font-code-mono text-xs text-outline">
                <span>AUG</span>
                <span>SEP</span>
                <span>OCT</span>
                <span>NOV</span>
                <span>DEC</span>
                <span>JAN</span>
                <span>FEB</span>
                <span className="font-bold text-primary">MAR (LIVE)</span>
              </div>
            </div>
          </div>

          {/* Recent Certificates High-Density Table */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container">
              <div>
                <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                  Recent Certificates Ledger
                </h3>
                <p className="text-xs text-secondary">
                  Real-time cryptographic attestations on smart contract
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg bg-surface-container-low p-1 text-xs border border-surface-container">
                  {(['All', 'Verified', 'Pending', 'Revoked'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        statusFilter === filter
                          ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                          : 'text-secondary hover:text-on-surface'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/certificates')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View All
                </Button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-outline font-semibold uppercase tracking-wider border-b border-surface-container">
                    <th className="py-3 px-4">Certificate ID & Hash</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Qualification</th>
                    <th className="py-3 px-4">Conferral Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {filteredCerts.slice(0, 5).map((cert) => (
                    <tr key={cert.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-code-mono font-semibold text-on-surface block">
                          {cert.id}
                        </span>
                        <button
                          onClick={() => copyHash(cert.txHash)}
                          className="inline-flex items-center gap-1 font-code-mono text-primary text-[11px] hover:underline"
                        >
                          <span>{copiedHash === cert.txHash ? 'Copied!' : cert.txHash}</span>
                          <Copy className="w-3 h-3 text-outline" />
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px]">
                            {cert.studentInitials || cert.studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-on-surface block truncate max-w-[130px]">
                              {cert.studentName}
                            </span>
                            <span className="font-code-mono text-outline text-[10px] block">
                              {cert.studentId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-on-surface block truncate max-w-[200px]">
                          {cert.degree}
                        </span>
                        {cert.honors && (
                          <span className="text-[10px] text-amber-800 font-semibold block">
                            {cert.honors}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-on-surface block">{cert.date}</span>
                        <span className="font-code-mono text-outline text-[10px]">
                          Block #{cert.blockNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            cert.status === 'Verified'
                              ? 'verified'
                              : cert.status === 'Pending'
                              ? 'pending'
                              : 'revoked'
                          }
                          size="sm"
                        >
                          {cert.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onShowQR(cert)}
                            className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
                            title="Show Verification QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onInspect(cert)}
                            className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
                            title="Inspect Parchment & Cryptographic Proof"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {cert.status !== 'Revoked' && (
                            <button
                              onClick={() => onRevoke(cert)}
                              className="p-1.5 rounded hover:bg-rose-50 text-secondary hover:text-error transition-colors"
                              title="Revoke Certificate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): On-Chain Stream & Key Custody */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* On-Chain Stream */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                <h3 className="font-headline-sm text-sm font-semibold text-on-surface">
                  On-Chain Activity Stream
                </h3>
              </div>
              <div className="inline-flex p-0.5 rounded-md bg-surface-container-low font-code-mono text-[11px] border border-surface-container">
                <button
                  onClick={() => setNetworkTab('Mainnet')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    networkTab === 'Mainnet'
                      ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                      : 'text-secondary'
                  }`}
                >
                  Mainnet
                </button>
                <button
                  onClick={() => setNetworkTab('Polygon')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    networkTab === 'Polygon'
                      ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                      : 'text-secondary'
                  }`}
                >
                  Polygon
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {activityStream.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-lg bg-surface-container-low/70 hover:bg-surface-container-low transition-colors flex flex-col gap-1 border border-surface-container/60 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-on-surface">
                    <span className="truncate">{evt.title}</span>
                    <span className="font-code-mono text-[10px] text-primary">{evt.timeAgo}</span>
                  </div>
                  <p className="text-[11px] text-secondary">{evt.description}</p>
                  {evt.txHash && (
                    <div className="flex items-center justify-between font-code-mono text-[10px] text-outline pt-0.5">
                      <span className="text-primary hover:underline cursor-pointer">
                        {evt.txHash}
                      </span>
                      <span>{evt.gasCost}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Smart contract badge */}
            <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1 text-xs border border-surface-container-high">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-outline uppercase text-[10px]">Smart Contract Registry</span>
                <span className="font-code-mono text-primary text-[11px]">v3.2.0</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-secondary">Contract:</span>
                <span className="font-semibold text-on-surface font-code-mono">CertiChainRegistry.sol</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-secondary">Consensus:</span>
                <span className="text-primary font-semibold">100% Operational</span>
              </div>
            </div>
          </div>

          {/* Multi-Sig Custody */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-700" />
                <h3 className="font-headline-sm text-sm font-semibold text-on-surface">
                  Hardware Key Custody
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-code-mono text-[11px] font-semibold">
                3-of-5 Quorum
              </span>
            </div>

            <p className="text-xs text-secondary">
              Issuance batch anchors and disciplinary revocations require multi-sig quorum.
            </p>

            <div className="flex flex-col gap-2">
              {SIGNERS_LIST.map((sig) => (
                <div
                  key={sig.id}
                  className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-on-surface block">{sig.name}</span>
                    <span className="text-[10px] text-outline block">{sig.role}</span>
                  </div>
                  <Badge
                    variant={sig.status === 'Signed' ? 'verified' : 'pending'}
                    size="sm"
                  >
                    {sig.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
