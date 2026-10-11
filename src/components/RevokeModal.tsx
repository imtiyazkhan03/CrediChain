import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { Button } from './ui/Button';
import type { Certificate } from '../types';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Wallet,
} from 'lucide-react';

interface RevokeModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRevoke: (certId: string, reason: string) => void;
}

export const RevokeModal: React.FC<RevokeModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onConfirmRevoke,
}) => {
  const {
    account,
    isConnected,
    isConfigured,
    isAdmin,
    networkName,
    isUnsupportedNetwork,
    revokeCertificateOnChain,
    connectWallet,
  } = useWeb3();

  const [reasonCode, setReasonCode] = useState<number>(101);
  const [reason, setReason] = useState(
    'Academic dishonesty confirmed by University Disciplinary Board.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    if (isConnected && isConfigured) {
      if (isUnsupportedNetwork) {
        alert(`Please switch your wallet to ${networkName} before revoking.`);
        return;
      }
      if (!isAdmin) {
        alert(
          `Your connected account (${account?.slice(0, 8)}...) does not have Administrator privileges on this smart contract. Only authorized administrators can revoke credentials.`
        );
        return;
      }

      setIsSubmitting(true);
      try {
        const docketRef = ethers.keccak256(ethers.toUtf8Bytes(reason));
        await revokeCertificateOnChain(certificate.id, reasonCode, docketRef);
        onConfirmRevoke(certificate.id, reason);
        onClose();
      } catch (err) {
        console.error('On-chain revocation failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Local simulation mode
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onConfirmRevoke(certificate.id, reason);
        onClose();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h3 className="font-headline-sm text-base font-semibold text-on-surface">
          Revoke Academic Certificate
        </h3>
        <p className="text-xs text-secondary mt-1">
          This action will permanently and irreversibly mark the credential as <strong className="text-error">REVOKED</strong> on-chain.
        </p>

        {/* Certificate Card summary */}
        <div className="my-3 p-3 rounded-lg bg-surface-container-low border border-surface-container text-xs flex flex-col gap-1 text-left">
          <div className="flex justify-between items-center">
            <span className="font-code-mono font-semibold text-on-surface">{certificate.id}</span>
            <span className="text-[11px] text-outline font-code-mono">Block #{certificate.blockNumber}</span>
          </div>
          <span className="font-semibold text-on-surface">
            {certificate.studentName} ({certificate.studentId})
          </span>
          <span className="text-secondary truncate">{certificate.degree}</span>
        </div>

        {/* Web3 Administrator Status Banner */}
        <div className="mb-3 p-2.5 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between text-xs text-left">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-secondary">Admin Signer:</span>
          </div>
          {isConnected ? (
            isAdmin ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold font-code-mono text-[10px] border border-emerald-500/20">
                ✓ ADMIN AUTHORIZED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold font-code-mono text-[10px] border border-rose-500/20">
                ✕ NOT ADMIN
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={() => connectWallet()}
              className="text-primary hover:underline font-semibold text-[11px]"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <form onSubmit={handleRevoke} className="flex flex-col gap-3 text-left">
          <div>
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider block mb-1">
              Categorical Reason Code *
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-error"
            >
              <option value={101}>101 — Academic Dishonesty / Grade Tampering</option>
              <option value={102}>102 — Administrative Error / Duplicate Registry Entry</option>
              <option value={103}>103 — Disciplinary Committee Rescission</option>
              <option value={104}>104 — Judicial Revocation Order</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider block mb-1">
              Revocation Audit Rationale *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-error"
              placeholder="Provide official rationale for on-chain audit record..."
            />
          </div>

          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-error mt-0.5" />
            <span>
              Irreversible action. Public verifiers will immediately flag this degree as NULLIFIED.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<ShieldAlert className="w-4 h-4" />}
            >
              Confirm Irreversible Revocation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
