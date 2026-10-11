import React, { useState } from 'react';
import type { Certificate } from '../types';

interface CertificateInspectModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateInspectModal: React.FC<CertificateInspectModalProps> = ({
  certificate,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!certificate) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-on-surface/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="h-16 px-6 bg-inverse-surface text-surface-container-lowest flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-base text-surface-container-lowest font-semibold">
                  Cryptographic Certificate Inspection
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-code-mono font-semibold ${
                    certificate.status === 'Verified'
                      ? 'bg-surface-container-highest text-primary'
                      : certificate.status === 'Pending'
                      ? 'bg-tertiary-fixed text-tertiary'
                      : 'bg-error-container text-error'
                  }`}
                >
                  {certificate.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] font-code-mono text-outline-variant">
                Certificate ID: {certificate.id} · Block #{certificate.blockNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-surface-container/20 hover:bg-surface-container/30 text-white transition-colors"
              title="Print Diploma"
            >
              <span className="material-symbols-outlined text-lg">print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-surface-container/20 hover:bg-surface-container/30 text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 bg-background">
          {/* THE CERTIFICATE PARCHMENT CANVAS */}
          <div className="parchment-canvas rounded-xl p-8 sm:p-12 border border-[#e2e8f0] relative overflow-hidden bg-white text-center">
            {/* Watermark Stanford Coat of Arms Seal */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
              <svg className="w-96 h-96" viewBox="0 0 200 200" fill="#8d4b00">
                <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="8" fill="none" />
                <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                <path d="M100 20 L115 65 L165 70 L125 100 L140 150 L100 120 L60 150 L75 100 L35 70 L85 65 Z" />
              </svg>
            </div>

            {/* University Crest & Title */}
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className="w-16 h-16 rounded-full bg-surface-container-low border-2 border-brand-gold/40 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-3xl text-brand-gold">account_balance</span>
              </div>
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold tracking-tight text-on-surface uppercase mt-2">
                Stanford University
              </h2>
              <span className="font-label-sm text-xs text-outline uppercase tracking-[0.25em] font-semibold">
                Office of the University Registrar
              </span>
              <div className="h-0.5 w-24 bg-brand-gold/40 my-2"></div>
            </div>

            {/* Recipient Notice */}
            <div className="relative z-10 my-4 flex flex-col items-center">
              <p className="text-secondary font-serif italic text-sm sm:text-base">
                Be it known that by authority of the Board of Trustees, upon recommendation of the Faculty of the
              </p>
              <p className="font-headline-sm text-base sm:text-lg font-semibold text-on-surface mt-1">
                {certificate.department}
              </p>
              <p className="text-secondary font-serif italic text-sm mt-1">
                has conferred upon
              </p>
              <h1 className="font-display-hero text-2xl sm:text-4xl font-bold text-on-surface tracking-tight my-2">
                {certificate.studentName}
              </h1>
              <p className="text-xs font-code-mono text-outline">
                Student UID: {certificate.studentId}
              </p>
            </div>

            {/* Degree and Honors */}
            <div className="relative z-10 my-3 flex flex-col items-center">
              <p className="text-secondary font-serif italic text-sm">
                the degree of
              </p>
              <p className="font-headline-lg text-lg sm:text-2xl font-bold text-primary mt-1">
                {certificate.degree}
              </p>
              {certificate.honors && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary font-label-md text-xs font-semibold border border-brand-gold/30">
                  <span className="material-symbols-outlined text-sm">military_tech</span>
                  <span>{certificate.honors}</span>
                </div>
              )}
              {certificate.gpa && (
                <span className="text-xs text-outline font-code-mono mt-1">
                  Cumulative GPA: {certificate.gpa}
                </span>
              )}
            </div>

            {/* Signatures & Seal Bar */}
            <div className="relative z-10 mt-8 pt-6 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Registrar signature */}
              <div className="flex flex-col items-center sm:items-start text-left">
                <span className="font-serif italic text-lg text-primary tracking-wide">
                  {certificate.issuer}
                </span>
                <div className="h-px w-40 bg-on-surface-variant/30 my-1"></div>
                <span className="text-xs font-semibold text-on-surface">{certificate.issuer}</span>
                <span className="text-[11px] text-outline">{certificate.issuerRole}</span>
              </div>

              {/* Official Gold Seal Watermark Stamp */}
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-brand-gold flex flex-col items-center justify-center p-2 shadow-md relative">
                  <span className="material-symbols-outlined text-brand-gold text-2xl">verified</span>
                  <span className="text-[9px] font-bold text-brand-gold uppercase tracking-wider text-center leading-tight mt-0.5">
                    Official On-Chain
                  </span>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-xs">
                    <span className="material-symbols-outlined text-xs">shield_check</span>
                  </div>
                </div>
              </div>

              {/* Dean signature */}
              <div className="flex flex-col items-center sm:items-end text-right">
                <span className="font-serif italic text-lg text-primary tracking-wide">
                  {certificate.coSigner}
                </span>
                <div className="h-px w-40 bg-on-surface-variant/30 my-1"></div>
                <span className="text-xs font-semibold text-on-surface">{certificate.coSigner}</span>
                <span className="text-[11px] text-outline">{certificate.coSignerRole}</span>
              </div>
            </div>
          </div>

          {/* CRYPTOGRAPHIC PROOF TERMINAL */}
          <div className="bg-inverse-surface rounded-xl p-5 border border-white/10 text-white flex flex-col gap-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed">terminal</span>
                <span className="font-label-md text-sm font-semibold text-surface-container-lowest">
                  Cryptographic Integrity Ledger & Proof Blocks
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary-container/40 text-primary-fixed font-code-mono text-xs">
                Poseidon Merkle Tree v2
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-code-mono">
              {/* Full Transaction Hash */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low/10 border border-white/5">
                <div className="flex items-center justify-between text-outline-variant text-[11px]">
                  <span>TRANSACTION HASH</span>
                  <button
                    onClick={() => copyToClipboard(certificate.fullTxHash || certificate.txHash, 'tx')}
                    className="text-primary-fixed hover:underline flex items-center gap-1"
                  >
                    <span>{copiedKey === 'tx' ? 'Copied!' : 'Copy'}</span>
                    <span className="material-symbols-outlined text-xs">content_copy</span>
                  </button>
                </div>
                <span className="text-surface-container-lowest break-all font-semibold">
                  {certificate.fullTxHash || certificate.txHash}
                </span>
              </div>

              {/* Merkle Root */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low/10 border border-white/5">
                <div className="flex items-center justify-between text-outline-variant text-[11px]">
                  <span>MERKLE ROOT ANCHOR</span>
                  <button
                    onClick={() => copyToClipboard(certificate.merkleRoot, 'root')}
                    className="text-primary-fixed hover:underline flex items-center gap-1"
                  >
                    <span>{copiedKey === 'root' ? 'Copied!' : 'Copy'}</span>
                    <span className="material-symbols-outlined text-xs">content_copy</span>
                  </button>
                </div>
                <span className="text-surface-container-lowest break-all font-semibold">
                  {certificate.merkleRoot}
                </span>
              </div>

              {/* IPFS Metadata URI */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low/10 border border-white/5">
                <div className="flex items-center justify-between text-outline-variant text-[11px]">
                  <span>IPFS DECENTRALIZED CID</span>
                  <button
                    onClick={() => copyToClipboard(certificate.ipfsCid, 'ipfs')}
                    className="text-primary-fixed hover:underline flex items-center gap-1"
                  >
                    <span>{copiedKey === 'ipfs' ? 'Copied!' : 'Copy'}</span>
                    <span className="material-symbols-outlined text-xs">content_copy</span>
                  </button>
                </div>
                <span className="text-surface-container-lowest break-all">
                  {certificate.ipfsCid}
                </span>
              </div>

              {/* Block & Consensus */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low/10 border border-white/5">
                <div className="flex items-center justify-between text-outline-variant text-[11px]">
                  <span>CONSENSUS & STATUS</span>
                  <span className="text-primary-fixed font-semibold">14 Confirmations</span>
                </div>
                <div className="flex items-center justify-between text-surface-container-lowest mt-1">
                  <span>Block: #{certificate.blockNumber}</span>
                  <span className="text-outline-variant text-[11px]">{certificate.mintedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-16 px-6 bg-surface-container-lowest border-t border-surface-container flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-outline">
            <span className="material-symbols-outlined text-primary text-sm">lock</span>
            <span>Tamper-proof verifiable on Ethereum Mainnet & IPFS</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(window.location.href, 'link')}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              <span>{copiedKey === 'link' ? 'Link Copied!' : 'Share Proof Link'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download Signed PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
