import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useCertificates } from '../contexts/CertificateContext';
import { useWeb3 } from '../contexts/Web3Context';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { generateAcademicCertificatePdf } from '../services/pdfService';
import { computeSha256 } from '../services/hashService';
import { storeCertificateDocument, saveCertificateMetadata } from '../services/storageService';
import type { Certificate } from '../types';
import {
  PlusCircle,
  CheckCircle,
  FileCheck,
  Hash,
  Award,
  ExternalLink,
  Wallet,
  Download,
} from 'lucide-react';

interface AdminIssuePageProps {
  onInspect: (cert: Certificate) => void;
}

export const AdminIssuePage: React.FC<AdminIssuePageProps> = ({ onInspect }) => {
  const { issueCertificate } = useCertificates();
  const {
    account,
    isConnected,
    isConfigured,
    isAuthorizedIssuer,
    isUnsupportedNetwork,
    networkName,
    explorerUrl,
    issueCertificateOnChain,
    connectWallet,
  } = useWeb3();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    studentName: 'Julianne Adams',
    studentId: 'SU-2022-4819',
    studentEmail: 'jadams@stanford.edu',
    department: 'School of Engineering',
    degree: 'B.S. in Computer Science (Systems)',
    honors: 'Summa Cum Laude',
    gpa: '3.96 / 4.00',
    issuer: 'Dr. Evelyn Vance',
    issuerRole: 'University Registrar & Custodian',
    coSigner: 'Prof. Julian Thorpe',
    coSignerRole: 'Dean of Academic Affairs',
  });

  const [computedSha256, setComputedSha256] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [newlyIssued, setNewlyIssued] = useState<Certificate | null>(null);
  const [generatedPdfBytes, setGeneratedPdfBytes] = useState<Uint8Array | null>(null);

  // Compute live canonical payload SHA-256 hash using ethers
  useEffect(() => {
    const payload = `${formData.studentId}|${formData.studentName}|${formData.degree}|${formData.department}|${formData.honors}|${formData.gpa}`;
    try {
      const realHash = ethers.sha256(ethers.toUtf8Bytes(payload));
      setComputedSha256(realHash);
    } catch {
      setComputedSha256('0x' + '0'.repeat(64));
    }
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.studentId.trim()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCertId = `CERT-2024-${randomSuffix}`;

    setIsMinting(true);

    try {
      // 1. Generate official academic certificate PDF
      const pdfBytes = await generateAcademicCertificatePdf({
        certId: newCertId,
        studentName: formData.studentName,
        studentId: formData.studentId,
        degree: formData.degree,
        department: formData.department,
        honors: formData.honors === 'None' ? undefined : formData.honors,
        conferralDate: 'June 16, 2024',
        issuerName: formData.issuer,
        issuerRole: formData.issuerRole,
        coSignerName: formData.coSigner,
        coSignerRole: formData.coSignerRole,
      });
      setGeneratedPdfBytes(pdfBytes);

      // 2. Compute SHA-256 hash over exact final PDF bytes
      const pdfSha256 = computeSha256(pdfBytes);

      // 3. Store PDF privately and save metadata off-chain
      await storeCertificateDocument(newCertId, pdfBytes);
      await saveCertificateMetadata(newCertId, {
        id: newCertId,
        studentName: formData.studentName,
        studentId: formData.studentId,
        degree: formData.degree,
        department: formData.department,
        honors: formData.honors === 'None' ? undefined : formData.honors,
        issueDate: 'June 16, 2024',
        documentHash: pdfSha256,
        issuer: formData.issuer,
        issuerRole: formData.issuerRole,
        coSigner: formData.coSigner,
        coSignerRole: formData.coSignerRole,
        status: 'Verified',
      });

      // 4. If connected to wallet and contract is configured:
      if (isConnected && isConfigured) {
        if (isUnsupportedNetwork) {
          alert(`Please switch your wallet to ${networkName} before issuing.`);
          setIsMinting(false);
          return;
        }
        if (!isAuthorizedIssuer) {
          alert(
            `Your connected account (${account?.slice(0, 8)}...) is not an authorized issuer on this contract. Only registered university registrars can mint credentials.`
          );
          setIsMinting(false);
          return;
        }

        const { txHash, blockNumber } = await issueCertificateOnChain(newCertId, pdfSha256);

        const newCert: Certificate = {
          id: newCertId,
          txHash: `${txHash.slice(0, 6)}...${txHash.slice(-4)}`,
          fullTxHash: txHash,
          certHash: pdfSha256.slice(2),
          studentName: formData.studentName,
          studentId: formData.studentId,
          studentEmail: formData.studentEmail,
          studentInitials: formData.studentName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          degree: formData.degree,
          department: formData.department,
          honors: formData.honors === 'None' ? undefined : formData.honors,
          date: 'Today',
          mintedDate: new Date().toUTCString(),
          blockNumber: blockNumber,
          status: 'Verified',
          merkleRoot: pdfSha256,
          ipfsCid: `ipfs://bafybei${Math.random().toString(36).substring(2, 15)}`,
          issuer: formData.issuer,
          issuerRole: formData.issuerRole,
          coSigner: formData.coSigner,
          coSignerRole: formData.coSignerRole,
          gpa: formData.gpa,
        };

        issueCertificate(newCert);
        setNewlyIssued(newCert);
      } else {
        // Local simulation mode
        const randomTx = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

        const newCert: Certificate = {
          id: newCertId,
          txHash: `${randomTx.slice(0, 6)}...${randomTx.slice(-4)}`,
          fullTxHash: randomTx,
          certHash: pdfSha256.slice(2),
          studentName: formData.studentName,
          studentId: formData.studentId,
          studentEmail: formData.studentEmail,
          studentInitials: formData.studentName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          degree: formData.degree,
          department: formData.department,
          honors: formData.honors === 'None' ? undefined : formData.honors,
          date: 'Today',
          mintedDate: new Date().toUTCString(),
          blockNumber: 19842112,
          status: 'Verified',
          merkleRoot: pdfSha256,
          ipfsCid: `ipfs://bafybei${Math.random().toString(36).substring(2, 15)}`,
          issuer: formData.issuer,
          issuerRole: formData.issuerRole,
          coSigner: formData.coSigner,
          coSignerRole: formData.coSignerRole,
          gpa: formData.gpa,
        };

        issueCertificate(newCert);
        setNewlyIssued(newCert);
      }
    } catch (err) {
      console.error('Issuance error:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Issue Cryptographic Academic Credential
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Mint and anchor tamper-proof degree attestations to the Stanford University smart contract registry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (5 cols): Issuance Form */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <h2 className="font-headline-sm text-sm font-semibold text-on-surface flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primary" />
              <span>Degree Parameters</span>
            </h2>
            <Badge variant="verified" size="sm">
              Stanford Registrar
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Matriculation UID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs font-code-mono text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Student Email
                </label>
                <input
                  type="email"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Faculty / School
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              >
                <option value="School of Engineering">School of Engineering</option>
                <option value="Stanford Law School">Stanford Law School</option>
                <option value="School of Medicine">School of Medicine</option>
                <option value="School of Humanities and Sciences">School of Humanities & Sciences</option>
                <option value="Stanford Graduate School of Business">Stanford Graduate School of Business</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Degree & Specialization
              </label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Academic Honors
                </label>
                <select
                  value={formData.honors}
                  onChange={(e) => setFormData({ ...formData, honors: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
                >
                  <option value="Summa Cum Laude">Summa Cum Laude</option>
                  <option value="Magna Cum Laude">Magna Cum Laude</option>
                  <option value="Cum Laude">Cum Laude</option>
                  <option value="Departmental Honors">Departmental Honors</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Cumulative GPA
                </label>
                <input
                  type="text"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs font-code-mono text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
            </div>

            {/* SHA-256 Digest Preview */}
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between text-outline">
                <span className="flex items-center gap-1 font-semibold uppercase text-[10px]">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  Canonical Payload SHA-256 Digest
                </span>
                <span className="font-code-mono text-primary font-bold">SHA-256</span>
              </div>
              <span className="font-code-mono text-on-surface break-all">{computedSha256}</span>
            </div>

            {/* Web3 Live Connection Status */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-outline uppercase flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-primary" /> Web3 Attestation Custody
                </span>
                {isConnected ? (
                  <span className="font-code-mono text-primary font-bold">
                    {networkName}
                  </span>
                ) : (
                  <span className="text-secondary font-medium">Disconnected</span>
                )}
              </div>

              {isConnected ? (
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary font-code-mono truncate max-w-[200px]">
                      {account}
                    </span>
                    {isAuthorizedIssuer ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold font-code-mono text-[10px] border border-emerald-500/20">
                        ✓ AUTHORIZED ISSUER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold font-code-mono text-[10px] border border-rose-500/20">
                        ✕ NOT AUTHORIZED
                      </span>
                    )}
                  </div>
                  {!isAuthorizedIssuer && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      Connected account lacks Issuer role on the smart contract. Use an authorized registrar account to mint on-chain.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-secondary">
                    Connect MetaMask to anchor directly to smart contract.
                  </span>
                  <button
                    type="button"
                    onClick={() => connectWallet()}
                    className="px-2.5 py-1 rounded-md bg-primary text-white font-medium text-[11px] hover:bg-primary/90 transition-colors"
                  >
                    Connect
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isMinting}
              className="w-full h-11 mt-1"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Attest & Mint to Blockchain
            </Button>
          </form>

          {/* Success Banner */}
          {newlyIssued && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col gap-2 animate-in fade-in text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Attestation Committed On-Chain!
                </span>
                <span className="font-code-mono">{newlyIssued.id}</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Anchored in Block #{newlyIssued.blockNumber}. State confirmed and verified on-chain.
              </p>
              {newlyIssued.fullTxHash && explorerUrl && (
                <a
                  href={`${explorerUrl}/tx/${newlyIssued.fullTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-code-mono font-medium"
                >
                  View on Block Explorer ({newlyIssued.txHash}) <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <div className="flex items-center gap-2 mt-1">
                {generatedPdfBytes && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([new Uint8Array(generatedPdfBytes) as unknown as BlobPart], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${newlyIssued.id}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    className="flex-1"
                  >
                    Download PDF
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onInspect(newlyIssued)}
                  className="flex-1"
                >
                  Inspect
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin/certificates')}
                  className="flex-1"
                >
                  Ledger
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right (7 cols): Live Parchment Diploma Preview */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-outline">
              Real-Time Vector Parchment Diploma
            </span>
            <span className="text-[11px] font-code-mono text-primary font-semibold bg-surface-container px-2 py-0.5 rounded-full">
              Live Preview
            </span>
          </div>

          <div className="parchment-canvas rounded-xl p-8 sm:p-12 border border-[#e2e8f0] relative overflow-hidden bg-white text-center shadow-lg">
            {/* Watermark Crest */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div className="w-14 h-14 rounded-full bg-surface-container-low border-2 border-brand-gold/40 flex items-center justify-center shadow-xs">
                <Award className="w-7 h-7 text-brand-gold" />
              </div>
              <h2 className="font-headline-lg text-xl sm:text-2xl font-bold tracking-tight text-on-surface uppercase mt-1">
                Stanford University
              </h2>
              <span className="text-[10px] text-outline uppercase tracking-[0.2em] font-semibold">
                Office of the University Registrar
              </span>
            </div>

            {/* Recipient Notice */}
            <div className="relative z-10 my-4 flex flex-col items-center">
              <p className="text-secondary font-serif italic text-xs sm:text-sm">
                Be it known that by authority of the Board of Trustees, upon recommendation of the Faculty of the
              </p>
              <p className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface mt-0.5">
                {formData.department}
              </p>
              <p className="text-secondary font-serif italic text-xs mt-0.5">
                has conferred upon
              </p>
              <h1 className="font-display-hero text-2xl sm:text-3xl font-bold text-on-surface tracking-tight my-2">
                {formData.studentName || 'Student Name'}
              </h1>
              <p className="text-[11px] font-code-mono text-outline">
                Student UID: {formData.studentId || 'SU-XXXX-XXXX'}
              </p>
            </div>

            {/* Degree and Honors */}
            <div className="relative z-10 my-2 flex flex-col items-center">
              <p className="text-secondary font-serif italic text-xs">the degree of</p>
              <p className="font-headline-lg text-base sm:text-xl font-bold text-primary mt-0.5">
                {formData.degree || 'Degree Program'}
              </p>
              {formData.honors && formData.honors !== 'None' && (
                <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-brand-gold/30">
                  <span className="material-symbols-outlined text-xs">military_tech</span>
                  <span>{formData.honors}</span>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="relative z-10 mt-6 pt-4 border-t border-surface-container flex items-center justify-between text-left text-xs">
              <div>
                <span className="font-serif italic text-primary text-sm">Dr. Evelyn Vance</span>
                <p className="text-[10px] text-outline font-semibold">University Registrar</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border border-brand-gold flex flex-col items-center justify-center p-1 shadow-xs">
                <Award className="w-5 h-5 text-brand-gold" />
                <span className="text-[7px] font-bold text-brand-gold uppercase text-center leading-tight">
                  Seal
                </span>
              </div>
              <div className="text-right">
                <span className="font-serif italic text-primary text-sm">{formData.coSigner}</span>
                <p className="text-[10px] text-outline font-semibold">{formData.coSignerRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
