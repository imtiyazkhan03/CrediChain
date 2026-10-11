import React, { useState } from 'react';
import type { Certificate } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Copy, Check, ExternalLink, X, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ certificate, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!certificate) return null;

  const verifyUrl = `${window.location.origin}/verify/${certificate.id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden text-center p-6 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="font-headline-sm text-base font-semibold text-on-surface">
          Certificate Verification QR
        </h3>
        <p className="text-xs text-secondary mt-1">
          Scan to verify credentials directly on the Ethereum registry.
        </p>

        {/* QR Code Graphic (Crisp SVG matrix with Stanford logo in center) */}
        <div className="my-5 p-4 bg-white rounded-xl border border-surface-container shadow-xs relative flex flex-col items-center justify-center">
          <svg className="w-48 h-48" viewBox="0 0 160 160" fill="none">
            {/* Corner finder patterns */}
            <rect x="10" y="10" width="40" height="40" rx="6" stroke="#0f172a" strokeWidth="6" fill="none" />
            <rect x="22" y="22" width="16" height="16" rx="2" fill="#00685f" />
            <rect x="110" y="10" width="40" height="40" rx="6" stroke="#0f172a" strokeWidth="6" fill="none" />
            <rect x="122" y="22" width="16" height="16" rx="2" fill="#00685f" />
            <rect x="10" y="110" width="40" height="40" rx="6" stroke="#0f172a" strokeWidth="6" fill="none" />
            <rect x="22" y="122" width="16" height="16" rx="2" fill="#00685f" />

            {/* Matrix Data Points */}
            <circle cx="65" cy="20" r="3.5" fill="#0f172a" />
            <circle cx="80" cy="20" r="3.5" fill="#00685f" />
            <circle cx="95" cy="20" r="3.5" fill="#0f172a" />
            <circle cx="65" cy="35" r="3.5" fill="#00685f" />
            <circle cx="95" cy="35" r="3.5" fill="#0f172a" />
            <circle cx="65" cy="50" r="3.5" fill="#0f172a" />
            <circle cx="80" cy="50" r="3.5" fill="#0f172a" />
            <circle cx="20" cy="65" r="3.5" fill="#0f172a" />
            <circle cx="35" cy="65" r="3.5" fill="#00685f" />
            <circle cx="50" cy="65" r="3.5" fill="#0f172a" />
            <circle cx="110" cy="65" r="3.5" fill="#00685f" />
            <circle cx="125" cy="65" r="3.5" fill="#0f172a" />
            <circle cx="140" cy="65" r="3.5" fill="#00685f" />
            <circle cx="20" cy="80" r="3.5" fill="#00685f" />
            <circle cx="140" cy="80" r="3.5" fill="#0f172a" />
            <circle cx="20" cy="95" r="3.5" fill="#0f172a" />
            <circle cx="35" cy="95" r="3.5" fill="#00685f" />
            <circle cx="125" cy="95" r="3.5" fill="#0f172a" />
            <circle cx="140" cy="95" r="3.5" fill="#00685f" />
            <circle cx="65" cy="110" r="3.5" fill="#0f172a" />
            <circle cx="95" cy="110" r="3.5" fill="#00685f" />
            <circle cx="65" cy="125" r="3.5" fill="#00685f" />
            <circle cx="80" cy="125" r="3.5" fill="#0f172a" />
            <circle cx="110" cy="125" r="3.5" fill="#0f172a" />
            <circle cx="125" cy="125" r="3.5" fill="#00685f" />
            <circle cx="140" cy="125" r="3.5" fill="#0f172a" />
            <circle cx="65" cy="140" r="3.5" fill="#0f172a" />
            <circle cx="80" cy="140" r="3.5" fill="#00685f" />
            <circle cx="95" cy="140" r="3.5" fill="#0f172a" />
            <circle cx="125" cy="140" r="3.5" fill="#0f172a" />

            {/* Stanford Center Shield */}
            <circle cx="80" cy="80" r="14" fill="#ffffff" stroke="#d97706" strokeWidth="2" />
            <text x="80" y="84" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#00685f">SU</text>
          </svg>

          <span className="mt-2 text-[10px] font-code-mono text-outline font-semibold">
            {certificate.id}
          </span>
        </div>

        <div className="w-full mb-3 flex items-center justify-center">
          <Badge
            variant={
              certificate.status === 'Verified'
                ? 'verified'
                : certificate.status === 'Pending'
                ? 'pending'
                : 'revoked'
            }
          >
            {certificate.status} On-Chain
          </Badge>
        </div>

        <p className="text-xs font-semibold text-on-surface mb-1">{certificate.studentName}</p>
        <p className="text-[11px] text-secondary mb-4 truncate max-w-full px-2">{certificate.degree}</p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyUrl}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            className="w-full"
          >
            {copied ? 'Verification Link Copied!' : 'Copy Verification URL'}
          </Button>

          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold transition-colors"
          >
            <span>Open Public Verifier</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
