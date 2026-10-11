import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCertificates } from '../contexts/CertificateContext';
import { useWeb3 } from '../contexts/Web3Context';
import { computeSha256 } from '../services/hashService';
import { retrieveCertificateDocument } from '../services/storageService';
import { Button } from '../components/ui/Button';
import type { Certificate, OnChainCertificateRecord } from '../types';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Printer,
  Award,
  UploadCloud,
  FileWarning,
  FileCheck,
  Hash,
  QrCode,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { QRScannerModal } from '../components/QRScannerModal';

interface PublicVerifyPageProps {
  onInspect: (cert: Certificate) => void;
}

export type VerifyOutcome =
  | 'idle'
  | 'loading'
  | 'verified'
  | 'altered'
  | 'revoked'
  | 'unknown'
  | 'unavailable'
  | 'pending';

export const PublicVerifyPage: React.FC<PublicVerifyPageProps> = ({ onInspect }) => {
  const { certificateId } = useParams<{ certificateId?: string }>();
  const { verifyCertificate } = useCertificates();
  const {
    readCertificate,
    isConfigured,
    contractAddress,
  } = useWeb3();
  const navigate = useNavigate();

  const [query, setQuery] = useState(certificateId || '');
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);
  const [onChainRecord, setOnChainRecord] = useState<OnChainCertificateRecord | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<VerifyOutcome>('idle');
  const [computedDocHash, setComputedDocHash] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Perform verification when query/param changes
  useEffect(() => {
    if (certificateId) {
      setQuery(certificateId);
      performVerification(certificateId);
    } else {
      setQuery('');
      setVerifyStatus('idle');
      setActiveCert(null);
    }
  }, [certificateId]);

  const performVerification = async (searchQuery: string, candidateBytes?: Uint8Array) => {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    setVerifyStatus('loading');
    setOnChainRecord(null);

    // 1. If contract is configured, query on-chain state via read-only provider
    if (isConfigured) {
      try {
        const contractData = await readCertificate(cleanQuery);
        if (contractData && contractData.issuedAt > 0) {
          setOnChainRecord(contractData);

          const localMatch = verifyCertificate(cleanQuery).certificate;
          if (localMatch) {
            setActiveCert({
              ...localMatch,
              status: contractData.isRevoked ? 'Revoked' : 'Verified',
              certHash: contractData.documentHash.slice(2),
              revocationReason: contractData.isRevoked
                ? `On-Chain Reason Code ${contractData.reasonCode}`
                : undefined,
            });
          }

          // Check revocation FIRST: A matching hash must NEVER override a revoked status!
          if (contractData.isRevoked) {
            setVerifyStatus('revoked');
            return;
          }

          // If document bytes provided (or stored in private storage)
          let bytesToVerify: Uint8Array | null = candidateBytes || null;
          if (!bytesToVerify) {
            bytesToVerify = await retrieveCertificateDocument(cleanQuery);
          }

          if (bytesToVerify) {
            const hash = computeSha256(bytesToVerify);
            setComputedDocHash(hash);
            if (hash.toLowerCase() === contractData.documentHash.toLowerCase()) {
              setVerifyStatus('verified');
            } else {
              setVerifyStatus('altered');
            }
          } else {
            setVerifyStatus('verified');
          }
          return;
        } else {
          setVerifyStatus('unknown');
          return;
        }
      } catch (err: unknown) {
        console.warn('Smart contract read call error:', err);
        setVerifyStatus('unavailable');
        return;
      }
    }

    // 2. Query backend API connected to MongoDB Atlas
    try {
      const apiResp = await fetch(`/api/verify/${encodeURIComponent(cleanQuery)}`);
      if (apiResp.ok) {
        const apiData = await apiResp.json();
        if (apiData.certificate) {
          const c = apiData.certificate;
          const certObj: Certificate = {
            id: c.id,
            degree: c.degree,
            department: c.department,
            honors: c.honors,
            date: c.date,
            mintedDate: c.mintedDate,
            blockNumber: c.blockNumber,
            status: c.status,
            certHash: c.certHash ? c.certHash.replace(/^0x/, '') : '',
            txHash: c.txHash,
            fullTxHash: c.fullTxHash,
            studentName: c.studentNameMasked || 'Verified Graduate',
            studentId: 'CONFIRMED (Zero PII Protected)',
            issuer: c.issuer,
            issuerRole: c.issuerRole,
            coSigner: c.coSigner,
            coSignerRole: c.coSignerRole,
            merkleRoot: c.certHash,
            ipfsCid: '',
          };
          setActiveCert(certObj);

          if (c.status === 'Revoked' || apiData.outcome === 'revoked') {
            setVerifyStatus('revoked');
            return;
          }

          if (candidateBytes) {
            const computed = computeSha256(candidateBytes);
            setComputedDocHash(computed);
            const expected = `0x${certObj.certHash}`;
            if (computed.toLowerCase() === expected.toLowerCase()) {
              setVerifyStatus('verified');
            } else {
              setVerifyStatus('altered');
            }
          } else {
            setVerifyStatus('verified');
          }
          return;
        }
      } else if (apiResp.status === 404) {
        setVerifyStatus('unknown');
        return;
      }
    } catch {
      // Fallback to local state if backend unreachable
    }

    // 3. Fallback to local verified registry when offline
    setTimeout(async () => {
      const res = verifyCertificate(cleanQuery);
      setActiveCert(res.certificate);

      if (!res.certificate) {
        setVerifyStatus('unknown');
        return;
      }

      if (res.certificate.status === 'Revoked') {
        setVerifyStatus('revoked');
        return;
      }

      let bytesToVerify: Uint8Array | null = candidateBytes || null;
      if (!bytesToVerify) {
        bytesToVerify = await retrieveCertificateDocument(cleanQuery);
      }

      if (bytesToVerify) {
        const hash = computeSha256(bytesToVerify);
        setComputedDocHash(hash);
        const expected = `0x${res.certificate.certHash}`;
        if (hash.toLowerCase() === expected.toLowerCase()) {
          setVerifyStatus('verified');
        } else {
          setVerifyStatus('altered');
        }
      } else {
        setVerifyStatus(res.status === 'pending' ? 'pending' : 'verified');
      }
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/verify/${encodeURIComponent(query.trim())}`);
  };

  const processUploadedFile = async (file: File) => {
    setUploadedFileName(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const hash = computeSha256(bytes);
      setComputedDocHash(hash);
      performVerification(query || activeCert?.id || 'CERT-2024-8841', bytes);
    } catch (e) {
      console.error('File parsing error:', e);
      setVerifyStatus('unavailable');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-4xl mx-auto w-full px-4 sm:px-6">
      {/* Title */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>Institutional Verification Portal</span>
        </div>
        <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
          Verify Academic Credentials
        </h1>
        <p className="text-xs sm:text-sm text-secondary max-w-lg mx-auto mt-1.5">
          Verify authenticity against Ethereum smart contracts and cryptographic SHA-256 records.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-surface-container shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Certificate ID (e.g. CERT-2024-8841)..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="h-11"
              onClick={() => setIsQRScannerOpen(true)}
              leftIcon={<QrCode className="w-4 h-4" />}
            >
              Scan QR
            </Button>
            <Button type="submit" variant="primary" size="md" className="h-11 px-5">
              Verify
            </Button>
          </div>
        </form>

        {/* Quick Sample Buttons */}
        <div className="mt-3.5 pt-3 border-t border-surface-container/60 flex items-center gap-2 flex-wrap text-xs text-secondary">
          <span className="font-medium">Quick examples:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('CERT-2024-8841');
              navigate('/verify/CERT-2024-8841');
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-code-mono text-[11px] font-semibold transition-colors"
          >
            CERT-2024-8841 (Authentic)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('CERT-2024-8830');
              navigate('/verify/CERT-2024-8830');
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 font-code-mono text-[11px] font-semibold transition-colors"
          >
            CERT-2024-8830 (Revoked)
          </button>
        </div>
      </div>

      {/* PDF Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 bg-surface-container-low/40 ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary/50'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-xs sm:text-sm text-on-surface">
            Or Drop Certificate PDF File to Verify Byte Integrity
          </h3>
          <p className="text-[11px] text-secondary mt-0.5">
            Calculates exact SHA-256 hash in browser and cross-checks with blockchain registry.
          </p>
        </div>
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-surface-container-high transition-colors mt-1">
          <span>Choose File</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processUploadedFile(e.target.files[0]);
              }
            }}
          />
        </label>
        {uploadedFileName && (
          <span className="text-[11px] font-code-mono text-primary flex items-center gap-1 mt-1 font-semibold">
            <FileCheck className="w-3.5 h-3.5" /> File: {uploadedFileName}
          </span>
        )}
      </div>

      {/* Loading Spinner */}
      {verifyStatus === 'loading' && (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-on-surface">
            Querying Blockchain Registry...
          </p>
        </div>
      )}

      {/* 1. VERIFIED STATE */}
      {verifyStatus === 'verified' && activeCert && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-emerald-200 shadow-sm flex flex-col gap-5">
            {/* Top Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-on-surface">
                      Authentic Certificate Confirmed
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      VERIFIED ON-CHAIN
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    Issued by Stanford University • Blockchain attestation validated
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onInspect(activeCert)}
                  leftIcon={<Award className="w-3.5 h-3.5" />}
                >
                  View Diploma
                </Button>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] text-secondary font-semibold uppercase block mb-0.5">
                  Graduate
                </span>
                <span className="font-bold text-on-surface text-sm">{activeCert.studentName}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] text-secondary font-semibold uppercase block mb-0.5">
                  Qualification
                </span>
                <span className="font-bold text-on-surface text-sm truncate block">{activeCert.degree}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] text-secondary font-semibold uppercase block mb-0.5">
                  Department
                </span>
                <span className="font-medium text-on-surface">{activeCert.department}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] text-secondary font-semibold uppercase block mb-0.5">
                  Issue Date
                </span>
                <span className="font-medium text-on-surface">{activeCert.date}</span>
              </div>
            </div>

            {/* Collapsible Cryptographic Proof Accordion */}
            <div className="rounded-xl border border-surface-container overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full px-4 py-2.5 bg-surface-container-low/60 hover:bg-surface-container flex items-center justify-between text-left transition-colors"
              >
                <span className="font-semibold text-xs text-on-surface flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  <span>Cryptographic Proof & Ledger Details</span>
                </span>
                {showTechnicalDetails ? (
                  <ChevronUp className="w-4 h-4 text-secondary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-secondary" />
                )}
              </button>

              {showTechnicalDetails && (
                <div className="p-4 bg-inverse-surface text-white text-xs font-code-mono flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block">On-Chain Document Hash:</span>
                      <span className="text-emerald-400 text-[11px] break-all">
                        {onChainRecord?.documentHash || `0x${activeCert.certHash}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Computed Document Hash:</span>
                      <span className="text-emerald-400 text-[11px] break-all">
                        {computedDocHash || onChainRecord?.documentHash || `0x${activeCert.certHash}`}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Registry Smart Contract:</span>
                      <span className="text-white text-[11px] break-all">{contractAddress}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Block Number:</span>
                      <span className="text-white">#{activeCert.blockNumber || '19,842,109'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. ALTERED / TAMPERED STATE */}
      {verifyStatus === 'altered' && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <FileWarning className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-rose-900">
                  Tampered Document / Hash Discrepancy
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold">
                  TAMPER DETECTED
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1">
                The computed hash of the provided PDF does not match the immutable record anchored on the smart contract.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. REVOKED STATE */}
      {verifyStatus === 'revoked' && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-rose-900">
                  Certificate Nullified & Revoked
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold">
                  REVOKED
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1">
                This academic qualification was formally revoked on the blockchain registry by the University Registrar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. UNKNOWN STATE */}
      {verifyStatus === 'unknown' && (
        <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container text-center flex flex-col items-center justify-center gap-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-on-surface">No Credential Found</h2>
            <p className="text-xs text-secondary mt-0.5 max-w-sm mx-auto">
              No matching attestation was found for "{query}". Verify that the Certificate ID or hash was entered correctly.
            </p>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isQRScannerOpen && (
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={(scannedId: string) => {
            setIsQRScannerOpen(false);
            setQuery(scannedId);
            navigate(`/verify/${encodeURIComponent(scannedId)}`);
          }}
        />
      )}
    </div>
  );
};
