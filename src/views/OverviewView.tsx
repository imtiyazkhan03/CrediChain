import React, { useState } from 'react';
import type { Certificate, ActivityEvent, Signer } from '../types';

interface OverviewViewProps {
  certificates: Certificate[];
  activityStream: ActivityEvent[];
  signers: Signer[];
  onInspectCertificate: (cert: Certificate) => void;
  onOpenVerifyModal: () => void;
  onOpenIssueModal: () => void;
  onNavigate: (path: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  certificates,
  activityStream,
  signers,
  onInspectCertificate,
  onOpenVerifyModal,
  onOpenIssueModal,
  onNavigate,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Verified' | 'Pending' | 'Revoked'>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7D' | '30D' | '90D' | 'AY'>('30D');
  const [networkTab, setNetworkTab] = useState<'Mainnet' | 'Polygon'>('Mainnet');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const filteredCertificates = certificates.filter((cert) => {
    if (selectedStatusFilter === 'All') return true;
    return cert.status === selectedStatusFilter;
  });

  const handleExportCSV = () => {
    const headers = 'Certificate ID,Student Name,Student ID,Degree,Honors,Block Number,Status,Tx Hash\n';
    const rows = certificates
      .map(
        (c) =>
          `"${c.id}","${c.studentName}","${c.studentId}","${c.degree}","${c.honors || 'N/A'}","${c.blockNumber}","${c.status}","${c.fullTxHash || c.txHash}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CertiChain_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full pb-space-xl gap-space-lg">
      {/* PAGE HEADER & ACTION BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md pt-space-xs">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
              Registrar Credential Dashboard
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono shadow-xs border border-surface-container-high">
              <span className="material-symbols-outlined text-primary text-label-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield_with_heart
              </span>
              <span>Contract: 0x71C...49A2</span>
              <span className="text-outline text-label-sm">(ERC-721 Accredited)</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>Sync: 12s ago</span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-secondary max-w-3xl">
            Monitor cryptographic attestations, issuance batches, student credential verification, and on-chain validity across all faculties.
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center flex-wrap gap-space-xs">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-space-sm py-2 rounded-lg bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container transition-all font-label-md text-label-md border border-surface-container"
          >
            <span className="material-symbols-outlined text-secondary text-body-lg">ios_share</span>
            <span>Batch Export CSV / Audit</span>
          </button>
          <button
            onClick={onOpenVerifyModal}
            className="inline-flex items-center gap-2 px-space-sm py-2 rounded-lg bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container transition-all font-label-md text-label-md border border-surface-container"
          >
            <span className="material-symbols-outlined text-primary text-body-lg">qr_code_scanner</span>
            <span>Verify Document Hash</span>
          </button>
          <button
            onClick={onOpenIssueModal}
            className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary shadow-xs transition-all font-label-md text-label-md group"
          >
            <span className="material-symbols-outlined text-body-lg group-hover:rotate-90 transition-transform">add</span>
            <span className="font-semibold">Issue Certificate</span>
            <kbd className="px-1.5 py-0.2 rounded bg-on-primary-fixed-variant text-on-primary text-label-sm font-code-mono">N</kbd>
          </button>
        </div>
      </div>

      {/* KEY METRIC CARDS (4-Column Dense Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Total Issued */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                Total Certificates Issued
              </span>
              <span className="font-display-hero text-display-hero text-on-surface tracking-tight mt-1">
                14,892
              </span>
            </div>
            <div className="p-2 rounded-lg bg-surface-container text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 pt-space-md">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center text-primary font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-label-sm">trending_up</span>
                +482 this semester
              </span>
              <span className="font-label-sm text-label-sm text-outline">(+3.4%)</span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary truncate">
              Across 6 Schools & 42 Departments
            </span>
          </div>
        </div>

        {/* Verified On-Chain */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                  Verified On-Chain
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-code-mono text-label-sm font-semibold">
                  97.9%
                </span>
              </div>
              <span className="font-display-hero text-display-hero text-on-surface tracking-tight mt-1">
                14,580
              </span>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-highest text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 pt-space-md">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center text-primary font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-label-sm">bolt</span>
                +1,240 verifications
              </span>
              <span className="font-label-sm text-label-sm text-outline">this month</span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary truncate">
              Instant employer & institutional checks
            </span>
          </div>
        </div>

        {/* Pending Consensus */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                Pending Batch Consensus
              </span>
              <span className="font-display-hero text-display-hero text-on-surface tracking-tight mt-1">
                278
              </span>
            </div>
            <div className="p-2 rounded-lg bg-tertiary-fixed text-tertiary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                hourglass_top
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 pt-space-md">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center text-tertiary font-label-sm text-label-sm font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse mr-1"></span>
                3 Batches Queued
              </span>
              <span className="font-label-sm text-label-sm text-outline">Epoch 412</span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary truncate">
              Est. confirmation: ~14 mins (gas 14 Gwei)
            </span>
          </div>
        </div>

        {/* Revoked / Nullified */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                  Revoked / Nullified
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-secondary font-code-mono text-label-sm font-semibold">
                  0.2%
                </span>
              </div>
              <span className="font-display-hero text-display-hero text-on-surface tracking-tight mt-1">
                34
              </span>
            </div>
            <div className="p-2 rounded-lg bg-error-container text-error">
              <span className="material-symbols-outlined">block</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 pt-space-md">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center text-secondary font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-label-sm">history</span>
                Audit trail logged
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary truncate">
              Cryptographically sealed nonces
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Analytics & Cert Table (~68%) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* SECTION A: Visual Activity & Issuance Analytics */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-lg shadow-xs border border-surface-container flex flex-col gap-space-md">
            {/* Chart Header & Timeframe Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                  Credential Issuance & Verification Volume
                </h2>
                <p className="font-body-sm text-body-sm text-secondary">
                  Cryptographic mints versus external ZK credential requests
                </p>
              </div>
              <div className="inline-flex p-1 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm self-start border border-surface-container">
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

            {/* Metric Badges Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs p-space-sm rounded-lg bg-surface-container-low border border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-body-md">local_gas_station</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Avg. Mint Cost</span>
                  <span className="font-code-mono text-code-mono text-on-surface font-semibold">
                    0.0014 ETH ($4.18)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-body-md">speed</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Instant Validation Rate</span>
                  <span className="font-code-mono text-code-mono text-on-surface font-semibold">
                    99.4% (&lt;850ms)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-body-md">account_tree</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Ledger Proof Scheme</span>
                  <span className="font-code-mono text-code-mono text-on-surface font-semibold">
                    Merkle Tree v2 + Poseidon
                  </span>
                </div>
              </div>
            </div>

            {/* SVG Chart Display */}
            <div className="relative w-full h-64 flex flex-col justify-end pt-4">
              <div className="absolute top-0 right-0 flex items-center gap-4 text-label-sm font-label-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="text-on-surface font-medium">Issued Degrees (Mints)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  <span className="text-on-surface font-medium">Employer Verifications</span>
                </div>
              </div>

              {/* Clean Vector Bar Chart */}
              <svg className="w-full h-52 overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
                {/* Grid lines */}
                <line className="text-surface-container" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="700" y1="20" y2="20" />
                <line className="text-surface-container" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="700" y1="70" y2="70" />
                <line className="text-surface-container" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="700" y1="120" y2="120" />
                <line className="text-surface-container" stroke="currentColor" strokeWidth="1" x1="0" x2="700" y1="170" y2="170" />

                {/* Aug */}
                <rect className="fill-primary" height="80" rx="4" width="22" x="25" y="90" />
                <rect className="fill-secondary-container" height="55" rx="4" width="22" x="52" y="115" />
                {/* Sep */}
                <rect className="fill-primary" height="115" rx="4" width="22" x="110" y="55" />
                <rect className="fill-secondary-container" height="90" rx="4" width="22" x="137" y="80" />
                {/* Oct */}
                <rect className="fill-primary" height="100" rx="4" width="22" x="195" y="70" />
                <rect className="fill-secondary-container" height="75" rx="4" width="22" x="222" y="95" />
                {/* Nov */}
                <rect className="fill-primary" height="85" rx="4" width="22" x="280" y="85" />
                <rect className="fill-secondary-container" height="110" rx="4" width="22" x="307" y="60" />
                {/* Dec (Graduation spike) */}
                <rect className="fill-primary" height="145" rx="4" width="22" x="365" y="25" />
                <rect className="fill-secondary-container" height="125" rx="4" width="22" x="392" y="45" />
                {/* Jan */}
                <rect className="fill-primary" height="75" rx="4" width="22" x="450" y="95" />
                <rect className="fill-secondary-container" height="100" rx="4" width="22" x="477" y="70" />
                {/* Feb */}
                <rect className="fill-primary" height="90" rx="4" width="22" x="535" y="80" />
                <rect className="fill-secondary-container" height="105" rx="4" width="22" x="562" y="65" />
                {/* Mar (Current) */}
                <rect className="fill-primary" height="130" rx="4" width="22" x="620" y="40" />
                <rect className="fill-secondary-container" height="140" rx="4" width="22" x="647" y="30" />
              </svg>

              {/* X-Axis Labels */}
              <div className="flex justify-between items-center px-4 pt-2 font-code-mono text-body-sm text-outline">
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

            {/* Academic Tier Filters */}
            <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold mr-1">
                Tiers:
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                B.Sc. & B.A. (64%)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">
                <span className="h-2 w-2 rounded-full bg-primary-container"></span>
                M.Sc. & M.Eng. (24%)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">
                <span className="h-2 w-2 rounded-full bg-tertiary"></span>
                Ph.D. & Postdoc (8%)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">
                <span className="h-2 w-2 rounded-full bg-secondary"></span>
                Executive Diplomas (4%)
              </span>
            </div>
          </div>

          {/* SECTION B: Recent Certificates Ledger (High-Density Table) */}
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container flex flex-col overflow-hidden">
            {/* Table Header & Controls */}
            <div className="p-space-md sm:p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-surface-container">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                    Recent Certificates Ledger
                  </h2>
                  <span className="font-body-sm text-body-sm text-secondary">
                    Real-time cryptographic attestations
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-code-mono text-label-sm font-semibold">
                  {certificates.length} Records Shown
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <div className="inline-flex rounded-lg bg-surface-container-low p-1 text-label-sm font-label-sm border border-surface-container">
                  {(['All', 'Verified', 'Pending', 'Revoked'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedStatusFilter(filter)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        selectedStatusFilter === filter
                          ? 'bg-surface-container-lowest text-on-surface font-medium shadow-xs'
                          : 'text-secondary hover:text-on-surface'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onNavigate('certificates')}
                  className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-primary-container font-semibold px-2 py-1"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined text-label-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Table Viewport */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                    <th className="py-3 px-4 font-semibold">Certificate ID & Proof</th>
                    <th className="py-3 px-4 font-semibold">Student Name & ID</th>
                    <th className="py-3 px-4 font-semibold">Qualification & Academic Honors</th>
                    <th className="py-3 px-4 font-semibold">Minted Block & Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-surface-container-low/60 transition-colors">
                      {/* Certificate ID & Proof */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-code-mono text-code-mono font-semibold text-on-surface">
                            {cert.id}
                          </span>
                          <button
                            onClick={() => copyHash(cert.txHash)}
                            className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-code-mono text-label-sm group w-fit mt-0.5"
                            title="Copy transaction hash"
                          >
                            <span>{copiedHash === cert.txHash ? 'Copied!' : cert.txHash}</span>
                            <span className="material-symbols-outlined text-label-sm opacity-60 group-hover:opacity-100">
                              content_copy
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Student Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {cert.studentAvatar ? (
                            <img
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-surface-container"
                              src={cert.studentAvatar}
                              alt={cert.studentName}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-semibold text-body-sm">
                              {cert.studentInitials || cert.studentName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                              {cert.studentName}
                            </span>
                            <span className="font-code-mono text-code-mono text-outline text-label-sm">
                              {cert.studentId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Qualification & Academic Honors */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-on-surface font-medium truncate max-w-xs">
                            {cert.degree}
                          </span>
                          {cert.honors && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold w-fit ${
                                cert.honors.includes('Cum Laude') || cert.honors.includes('Distinction')
                                  ? 'bg-tertiary-fixed text-tertiary-container'
                                  : 'bg-surface-container text-secondary'
                              }`}
                            >
                              <span className="material-symbols-outlined text-label-sm">military_tech</span>
                              {cert.honors}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Minted Block & Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-on-surface">{cert.date}</span>
                          <span className="font-code-mono text-code-mono text-outline text-label-sm">
                            Block #{cert.blockNumber}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {cert.status === 'Verified' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-label-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check_circle
                            </span>
                            Verified
                          </span>
                        )}
                        {cert.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-tertiary font-label-sm text-label-sm font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse"></span>
                            Consensus Pending
                          </span>
                        )}
                        {cert.status === 'Revoked' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-error font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-label-sm">block</span>
                            Revoked
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onInspectCertificate(cert)}
                            className="p-1.5 rounded-md hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
                            title="Inspect Proof"
                          >
                            <span className="material-symbols-outlined text-body-lg">visibility</span>
                          </button>
                          <button
                            onClick={() => onInspectCertificate(cert)}
                            className="p-1.5 rounded-md hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
                            title="Download Signed PDF"
                          >
                            <span className="material-symbols-outlined text-body-lg">download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination Micro */}
            <div className="p-space-md bg-surface-container-lowest border-t border-surface-container flex items-center justify-between text-body-sm font-body-sm text-secondary">
              <span>Showing {filteredCertificates.length} of 14,892 credentials</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded bg-surface-container-low text-secondary hover:text-on-surface text-label-sm disabled:opacity-50">
                  Prev
                </button>
                <span className="px-2 py-1 text-on-surface font-semibold text-label-sm">1</span>
                <button className="px-2 py-1 rounded hover:bg-surface-container-low text-label-sm">2</button>
                <button className="px-2 py-1 rounded hover:bg-surface-container-low text-label-sm">3</button>
                <span className="px-1 text-outline">...</span>
                <button className="px-2 py-1 rounded hover:bg-surface-container-low text-label-sm">2,979</button>
                <button className="px-2 py-1 rounded bg-surface-container-low text-secondary hover:text-on-surface text-label-sm">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Stream & Multi-Sig Custody (~32%) */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* SECTION C: Live Blockchain Activity Ledger Stream */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-surface-container flex flex-col gap-space-md">
            {/* Stream Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-ping"></span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                  On-Chain Stream
                </h2>
              </div>
              <div className="inline-flex p-0.5 rounded-md bg-surface-container-low font-code-mono text-label-sm border border-surface-container">
                <button
                  onClick={() => setNetworkTab('Mainnet')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    networkTab === 'Mainnet'
                      ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Mainnet
                </button>
                <button
                  onClick={() => setNetworkTab('Polygon')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    networkTab === 'Polygon'
                      ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Polygon
                </button>
              </div>
            </div>

            {/* Activity Feed List */}
            <div className="flex flex-col gap-space-sm">
              {activityStream.map((evt) => (
                <div
                  key={evt.id}
                  className="p-space-sm rounded-lg bg-surface-container-low/70 hover:bg-surface-container-low transition-colors flex flex-col gap-1.5 border border-surface-container/60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined ${evt.iconColor} text-body-lg`}>
                        {evt.icon}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        {evt.title}
                      </span>
                    </div>
                    <span className="font-code-mono text-label-sm text-primary font-semibold">
                      {evt.timeAgo}
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface">
                    {evt.description}
                  </p>

                  <div className="flex items-center justify-between font-code-mono text-body-sm text-secondary pt-0.5">
                    {evt.txHash ? (
                      <span
                        onClick={() => copyHash(evt.txHash!)}
                        className="text-primary hover:underline cursor-pointer"
                        title="Copy Tx Hash"
                      >
                        {evt.txHash}
                      </span>
                    ) : (
                      <span className="text-outline text-xs">{evt.subText}</span>
                    )}
                    {evt.gasCost && <span>{evt.gasCost}</span>}
                  </div>

                  {evt.subText && evt.txHash && (
                    <div className="flex items-center justify-between text-body-sm text-outline pt-0.5">
                      <span>{evt.subText}</span>
                      <span>{evt.status}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contract Registry Widget */}
            <div className="p-space-sm rounded-lg bg-surface-container flex flex-col gap-2 border border-surface-container-high">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                  Smart Contract Registry
                </span>
                <span className="font-code-mono text-label-sm text-primary font-semibold">v3.2.0</span>
              </div>
              <div className="flex flex-col gap-1 font-code-mono text-body-sm">
                <div className="flex justify-between text-on-surface">
                  <span className="text-secondary">Contract:</span>
                  <span className="font-semibold">CertiChainRegistry.sol</span>
                </div>
                <div className="flex justify-between text-on-surface">
                  <span className="text-secondary">Consensus:</span>
                  <span className="text-primary font-semibold">100% Operational</span>
                </div>
                <div className="flex justify-between text-on-surface">
                  <span className="text-secondary">Merkle Anchor:</span>
                  <span className="text-on-surface font-semibold">0x82b4...319d</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D: Multi-Sig Governance & Signatures */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-surface-container flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">key</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                  Key Custody & Multi-Sig
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-code-mono text-label-sm font-semibold">
                3-of-5 Quorum
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary">
              Revocation procedures, contract upgrades, and large graduation batches require M-of-N hardware key quorum.
            </p>

            {/* Signature Pipeline Visual */}
            <div className="flex flex-col gap-2.5">
              {signers.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-label-sm ${
                        sig.status === 'Signed'
                          ? 'bg-primary text-on-primary'
                          : 'bg-tertiary-fixed text-tertiary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {sig.status === 'Signed' ? 'check' : 'pending'}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                        {sig.name}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline truncate text-[11px]">
                        {sig.role}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-code-mono text-label-sm font-semibold ${
                      sig.status === 'Signed' ? 'text-primary' : 'text-tertiary'
                    }`}
                  >
                    {sig.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-label-sm text-label-sm text-outline text-[11px]">
                Next Scheduled Epoch: #413 (18:00 UTC)
              </span>
              <button
                onClick={() => onNavigate('settings')}
                className="font-label-sm text-label-sm text-primary hover:text-primary-container font-semibold"
              >
                Manage Keys
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
