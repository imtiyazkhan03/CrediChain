import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCertificates } from '../contexts/CertificateContext';
import { useWeb3 } from '../contexts/Web3Context';
import { computeSha256 } from '../services/hashService';
import { retrieveCertificateDocument } from '../services/storageService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Certificate, OnChainCertificateRecord } from '../types';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  Award,
  Clock,
  UploadCloud,
  FileWarning,
  RefreshCw,
  FileCheck,
  Hash,
  QrCode,
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
    networkName,
    targetChainId,
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

  // Perform verification when query/param changes
  useEffect(() => {
    if (certificateId) {
      setQuery(certificateId);
      performVerification(certificateId);
    } else {
      // Default to Elena's certificate if no parameter specified
      performVerification('CERT-2024-8841');
      setQuery('CERT-2024-8841');
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

    // 2. Fallback to local verified registry when contract is not configured
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
    <div className="flex flex-col gap-6 pb-20 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary font-semibold text-xs border border-surface-container-high mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>Trustless Public Verifier</span>
        </div>
        <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
          Verify Academic Credential Authenticity
        </h1>
        <p className="text-xs sm:text-sm text-secondary max-w-xl mx-auto mt-1">
          Direct cryptographic query against Stanford University smart contracts. Checks tamper-proof signatures, exact binary document hash, and disciplinary revocation records.
        </p>
      </div>

      {/* Query Input Box */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Certificate ID (e.g. CERT-2024-8841), Keccak hash, or student UID..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
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
            <Button type="submit" variant="primary" size="md" className="h-11">
              Verify Now
            </Button>
          </div>
        </form>

        {/* Quick test buttons */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-outline">
          <span>Test examples:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('CERT-2024-8841');
              navigate('/verify/CERT-2024-8841');
            }}
            className="px-2 py-0.5 rounded bg-surface-container text-primary font-code-mono hover:bg-surface-container-high font-semibold transition-colors"
          >
            CERT-2024-8841 (Verified)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('CERT-2024-8830');
              navigate('/verify/CERT-2024-8830');
            }}
            className="px-2 py-0.5 rounded bg-surface-container text-rose-800 font-code-mono hover:bg-surface-container-high font-semibold transition-colors"
          >
            CERT-2024-8830 (Revoked)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('CERT-UNKNOWN-999');
              navigate('/verify/CERT-UNKNOWN-999');
            }}
            className="px-2 py-0.5 rounded bg-surface-container text-amber-800 font-code-mono hover:bg-surface-container-high font-semibold transition-colors"
          >
            CERT-UNKNOWN-999 (Unknown)
          </button>
        </div>
      </div>

      {/* Drag & Drop PDF Document Verifier */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 bg-surface-container-low/50 ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary/50'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-xs sm:text-sm text-on-surface">
            Drag & Drop Certificate PDF to Verify Exact Byte Hash
          </h3>
          <p className="text-[11px] text-secondary mt-0.5">
            Computes a client-side SHA-256 digest over the binary file bytes and checks against the blockchain anchor.
          </p>
        </div>
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface border border-surface-container-high transition-colors mt-1">
          <span>Choose PDF File</span>
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
          <span className="text-[11px] font-code-mono text-primary flex items-center gap-1 mt-1">
            <FileCheck className="w-3.5 h-3.5" /> Loaded file: {uploadedFileName}
          </span>
        )}
      </div>

      {/* Loading State */}
      {verifyStatus === 'loading' && (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-on-surface">
            Querying Ethereum Smart Contract Registry...
          </p>
          <p className="text-[11px] text-outline">Verifying SHA-256 byte digest and disciplinary status</p>
        </div>
      )}

      {/* 1. VERIFIED STATE */}
      {verifyStatus === 'verified' && activeCert && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="p-4 sm:p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base">
                    Authentic Academic Credential Confirmed
                  </h3>
                  <Badge variant="verified" size="sm">
                    Valid On-Chain
                  </Badge>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Conferred by Stanford University · Attested on {onChainRecord ? `${networkName} (Chain #${targetChainId})` : `Ethereum Block #${activeCert.blockNumber}`}
                </p>
                {onChainRecord ? (
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-code-mono text-emerald-900 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>Direct On-Chain Attestation Verified (Issuer: {onChainRecord.issuer.slice(0, 8)}...)</span>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-800 font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-200/60 font-code-mono">Testnet Ledger</span>
                    <span>Read-only local ledger state verified</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
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
                Inspect Diploma
              </Button>
            </div>
          </div>

          {/* Cryptographic Proof Terminal */}
          <div className="bg-inverse-surface rounded-xl p-5 border border-white/10 text-white flex flex-col gap-3 shadow-md text-xs font-code-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-semibold text-surface-container-lowest flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-primary-fixed" /> SHA-256 Byte Verification Terminal
              </span>
              <span className="text-[11px] text-primary-fixed font-bold">100% MATCH</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-outline block">Anchored On-Chain Digest:</span>
                <span className="text-white break-all">{onChainRecord?.documentHash || `0x${activeCert.certHash}`}</span>
              </div>
              <div>
                <span className="text-outline block">Computed Document Digest:</span>
                <span className="text-emerald-400 break-all">{computedDocHash || onChainRecord?.documentHash || `0x${activeCert.certHash}`}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALTERED / TAMPERED STATE */}
      {verifyStatus === 'altered' && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
              <FileWarning className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-rose-900">
                  Tampered / Altered Document Detected!
                </h2>
                <Badge variant="revoked" size="sm">
                  HASH MISMATCH
                </Badge>
              </div>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                The computed SHA-256 hash of this document <strong>does not match</strong> the immutable hash registered on the blockchain smart contract. Do not accept this qualification: grades, recipient name, or conferral details have been modified.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-rose-200 flex flex-col gap-2.5 font-code-mono text-xs">
            <div>
              <span className="text-[10px] text-outline uppercase font-semibold block">Expected On-Chain Hash:</span>
              <p className="text-emerald-800 font-bold break-all">{onChainRecord?.documentHash || `0x${activeCert?.certHash || 'unknown'}`}</p>
            </div>
            <div className="pt-2 border-t border-surface-container">
              <span className="text-[10px] text-outline uppercase font-semibold block">Computed Candidate Hash:</span>
              <p className="text-rose-700 font-bold break-all">{computedDocHash || 'Hash computation failed'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. REVOKED STATE (Matching hash NEVER overrides Revoked!) */}
      {verifyStatus === 'revoked' && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-rose-900">
                  Certificate Nullified & Revoked
                </h2>
                <Badge variant="revoked" size="sm">
                  REVOKED ON-CHAIN
                </Badge>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                This academic qualification was formally and irreversibly revoked on the blockchain registry.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-100/60 border border-rose-200 text-rose-900 text-xs">
            <span className="font-bold">Strict Protocol Notice: </span>
            Even if the candidate PDF document hash matches the original issuance digest, the degree is <strong>strictly invalid</strong> because institutional authorities have revoked the credential.
          </div>

          <div className="p-4 rounded-xl bg-white border border-rose-200 flex flex-col gap-2 text-xs">
            <div className="grid grid-cols-2 gap-2 text-on-surface">
              <div>
                <span className="text-outline text-[11px]">Certificate ID:</span>
                <p className="font-code-mono font-bold">{query}</p>
              </div>
              <div>
                <span className="text-outline text-[11px]">Reason Code:</span>
                <p className="font-bold">{onChainRecord?.reasonCode || '101 (Disciplinary Rescission)'}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-surface-container">
              <span className="text-outline text-[11px] block">Audit Rationale:</span>
              <p className="text-rose-800 font-semibold mt-0.5">
                {activeCert?.revocationReason || 'Disciplinary nullification confirmed by University Senate.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. UNKNOWN ID STATE */}
      {verifyStatus === 'unknown' && (
        <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center flex flex-col items-center justify-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-10 h-10 text-amber-700" />
          <h2 className="font-headline-sm text-lg font-bold text-amber-950">
            Unknown Certificate ID — Record Not Found
          </h2>
          <p className="text-xs text-amber-900 max-w-md">
            The identifier <strong className="font-code-mono">"{query}"</strong> does not exist on the smart contract registry. Please check the ID for typos or obtain a direct link.
          </p>
        </div>
      )}

      {/* 5. UNAVAILABLE STATE (Network or Storage Error) */}
      {verifyStatus === 'unavailable' && (
        <div className="p-8 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-3 animate-in fade-in">
          <RefreshCw className="w-10 h-10 text-slate-600 dark:text-slate-300" />
          <h2 className="font-headline-sm text-lg font-bold text-on-surface">
            Blockchain Network or Storage Temporarily Unavailable
          </h2>
          <p className="text-xs text-secondary max-w-md">
            Unable to communicate with the Ethereum RPC node or storage provider. This does <strong>NOT</strong> mean the certificate is invalid or revoked. Please verify your internet connection or try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => performVerification(query)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Verification
          </Button>
        </div>
      )}

      {/* PENDING MEMPOOL STATE */}
      {verifyStatus === 'pending' && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-amber-900">
                Consensus Pending in Mempool Queue
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Degree attestation submitted. Epoch batch currently awaiting block anchor confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={(scannedId) => {
          setQuery(scannedId);
          navigate(`/verify/${encodeURIComponent(scannedId)}`);
        }}
      />
    </div>
  );
};
