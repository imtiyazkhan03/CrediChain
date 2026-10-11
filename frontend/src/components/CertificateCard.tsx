import React from 'react';
import type { Certificate } from '../types';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Eye, QrCode, Download, Award } from 'lucide-react';

interface CertificateCardProps {
  certificate: Certificate;
  onInspect: (cert: Certificate) => void;
  onShowQR: (cert: Certificate) => void;
  onDownloadPDF?: (cert: Certificate) => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onInspect,
  onShowQR,
  onDownloadPDF,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-surface-container">
      {/* Top Gold Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-amber-500 to-teal-700" />

      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold shadow-xs">
            <Award className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <span className="font-code-mono text-xs font-semibold text-on-surface block">
              {certificate.id}
            </span>
            <span className="text-[11px] text-outline font-code-mono block truncate max-w-[140px]">
              {certificate.txHash}
            </span>
          </div>
        </div>

        <Badge
          variant={
            certificate.status === 'Verified'
              ? 'verified'
              : certificate.status === 'Pending'
              ? 'pending'
              : 'revoked'
          }
          size="sm"
        >
          {certificate.status}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-1">
        <div>
          <h4 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface line-clamp-2">
            {certificate.degree}
          </h4>
          <p className="text-xs text-secondary mt-0.5">{certificate.department}</p>
        </div>

        {certificate.honors && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200 w-fit">
            <span className="material-symbols-outlined text-xs">military_tech</span>
            <span>{certificate.honors}</span>
          </div>
        )}

        <div className="pt-2 border-t border-surface-container grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-outline text-[11px]">Recipient</span>
            <p className="font-semibold text-on-surface truncate">{certificate.studentName}</p>
            <span className="font-code-mono text-outline text-[10px]">{certificate.studentId}</span>
          </div>
          <div>
            <span className="text-outline text-[11px]">Issued Date</span>
            <p className="font-medium text-on-surface">{certificate.date}</p>
            <span className="font-code-mono text-outline text-[10px]">Block #{certificate.blockNumber}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShowQR(certificate)}
          leftIcon={<QrCode className="w-3.5 h-3.5" />}
        >
          QR
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (onDownloadPDF ? onDownloadPDF(certificate) : onInspect(certificate))}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            title="Download / Print PDF"
          >
            PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onInspect(certificate)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Inspect
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
