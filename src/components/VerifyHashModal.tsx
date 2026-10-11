import React, { useState } from 'react';
import type { Certificate } from '../types';

interface VerifyHashModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: Certificate[];
  onSelectCertificate: (cert: Certificate) => void;
}

export const VerifyHashModal: React.FC<VerifyHashModalProps> = ({
  isOpen,
  onClose,
  certificates,
  onSelectCertificate,
}) => {
  const [query, setQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [matchResult, setMatchResult] = useState<Certificate | null | 'NOT_FOUND'>(null);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsVerifying(true);
    setMatchResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      const clean = query.trim().toLowerCase();
      const found = certificates.find(
        (c) =>
          c.id.toLowerCase() === clean ||
          c.txHash.toLowerCase().includes(clean) ||
          (c.fullTxHash && c.fullTxHash.toLowerCase().includes(clean)) ||
          c.studentId.toLowerCase() === clean ||
          c.studentName.toLowerCase().includes(clean)
      );

      if (found) {
        setMatchResult(found);
      } else {
        setMatchResult('NOT_FOUND');
      }
    }, 600);
  };

  const handleQuickFill = (sampleId: string) => {
    setQuery(sampleId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-16 px-6 bg-inverse-surface text-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-on-primary">
              <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base text-surface-container-lowest font-semibold">
                Verify Document Hash & Credentials
              </h3>
              <p className="text-[11px] text-outline-variant">
                Query Ethereum Mainnet consensus registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-container hover:bg-surface-variant/20 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
              Enter Certificate ID, Keccak-256 Digest, or Student UID
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CERT-2024-8841, 0x4b7f...989c, or SU-2020-0492"
                className="w-full h-11 pl-4 pr-10 rounded-lg bg-surface-container-low border border-surface-container text-sm font-code-mono text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                </button>
              )}
            </div>

            {/* Quick test pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-outline font-medium">Quick test:</span>
              <button
                type="button"
                onClick={() => handleQuickFill('CERT-2024-8841')}
                className="px-2 py-0.5 rounded bg-surface-container text-primary font-code-mono hover:bg-surface-container-high transition-colors"
              >
                CERT-2024-8841 (Elena)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('CERT-2024-8839')}
                className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-code-mono hover:bg-surface-container-high transition-colors"
              >
                CERT-2024-8839 (Pending)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('CERT-2024-8830')}
                className="px-2 py-0.5 rounded bg-surface-container text-error font-code-mono hover:bg-surface-container-high transition-colors"
              >
                CERT-2024-8830 (Revoked)
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !query.trim()}
              className="mt-2 h-10 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {isVerifying ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Verifying against Merkle Tree...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>Verify On-Chain Integrity</span>
                </>
              )}
            </button>
          </form>

          {/* Results Display */}
          {matchResult && matchResult !== 'NOT_FOUND' && (
            <div className="p-4 rounded-xl border border-surface-container bg-surface-container-lowest shadow-sm flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-xl ${
                      matchResult.status === 'Verified'
                        ? 'text-primary'
                        : matchResult.status === 'Pending'
                        ? 'text-tertiary'
                        : 'text-error'
                    }`}
                  >
                    {matchResult.status === 'Verified'
                      ? 'check_circle'
                      : matchResult.status === 'Pending'
                      ? 'hourglass_top'
                      : 'cancel'}
                  </span>
                  <span className="font-semibold text-sm text-on-surface">
                    {matchResult.status === 'Verified'
                      ? 'Authentic Attestation Verified'
                      : matchResult.status === 'Pending'
                      ? 'Consensus Pending in Epoch Queue'
                      : 'Attestation Nullified / Revoked'}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-code-mono font-semibold ${
                    matchResult.status === 'Verified'
                      ? 'bg-surface-container-highest text-primary'
                      : matchResult.status === 'Pending'
                      ? 'bg-tertiary-fixed text-tertiary'
                      : 'bg-error-container text-error'
                  }`}
                >
                  {matchResult.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-outline">Student:</span>
                  <p className="font-semibold text-on-surface">{matchResult.studentName}</p>
                </div>
                <div>
                  <span className="text-outline">Degree:</span>
                  <p className="font-semibold text-on-surface">{matchResult.degree}</p>
                </div>
                <div>
                  <span className="text-outline">Block Number:</span>
                  <p className="font-code-mono text-on-surface">#{matchResult.blockNumber}</p>
                </div>
                <div>
                  <span className="text-outline">Tx Hash:</span>
                  <p className="font-code-mono text-primary truncate">{matchResult.txHash}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectCertificate(matchResult);
                  onClose();
                }}
                className="mt-1 w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>View Full Official Diploma Parchment</span>
              </button>
            </div>
          )}

          {matchResult === 'NOT_FOUND' && (
            <div className="p-4 rounded-xl border border-error-container bg-surface-container-low text-xs flex items-center gap-3 text-error animate-in fade-in">
              <span className="material-symbols-outlined text-2xl text-error shrink-0">
                error_outline
              </span>
              <div>
                <p className="font-semibold text-sm">No Record Found on Ledger</p>
                <p className="text-outline mt-0.5">
                  The provided digest or Certificate ID does not match any accredited Stanford University attestation in our registry.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
