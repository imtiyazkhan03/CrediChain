import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useAuth } from '../contexts/AuthContext';
import { useCertificates } from '../contexts/CertificateContext';
import { useWeb3 } from '../contexts/Web3Context';
import { Button } from '../components/ui/Button';
import { generateAcademicCertificatePdf } from '../services/pdfService';
import { computeSha256 } from '../services/hashService';
import { storeCertificateDocument, saveCertificateMetadata } from '../services/storageService';
import type { Certificate } from '../types';
import {
  PlusCircle,
  CheckCircle,
  Award,
  Download,
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdminIssuePageProps {
  onInspect: (cert: Certificate) => void;
}

export const AdminIssuePage: React.FC<AdminIssuePageProps> = ({ onInspect }) => {
  const { currentUser } = useAuth();
  const { issueCertificate, refreshCertificates } = useCertificates();
  const {
    account,
    isConnected,
    isConfigured,
    contractAddress,
    targetChainId,
    isAuthorizedIssuer,
    isUnsupportedNetwork,
    networkName,
    issueCertificateOnChain,
    connectWallet,
  } = useWeb3();
  const navigate = useNavigate();

  // Blockchain anchoring toggle
  const [anchorOnBlockchain, setAnchorOnBlockchain] = useState(false);

  // Mode: Upload own PDF certificate vs Generate digital PDF
  const [issueMode, setIssueMode] = useState<'upload' | 'generate'>('upload');

  // Accordion for optional advanced details
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // File state for custom certificate
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileBytes, setUploadedFileBytes] = useState<Uint8Array | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    certId: `CERT-${Date.now().toString().slice(-6)}`,
    studentName: '',
    studentId: '',
    studentEmail: '',
    degree: '',
    department: '',
    honors: 'None',
    gpa: '',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    issuer: currentUser?.name || 'Academic Registrar',
    issuerRole: 'University Registrar & Custodian',
    coSigner: '',
    coSignerRole: 'Office of Academic Affairs',
  });

  // Sync issuer with authenticated user name if updated
  useEffect(() => {
    if (currentUser?.name && (!formData.issuer || formData.issuer === 'Academic Registrar')) {
      setFormData((prev) => ({ ...prev, issuer: currentUser.name }));
    }
  }, [currentUser?.name]);

  const [computedSha256, setComputedSha256] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [newlyIssued, setNewlyIssued] = useState<Certificate | null>(null);
  const [downloadPdfBytes, setDownloadPdfBytes] = useState<Uint8Array | null>(null);

  // Handle uploaded certificate file
  const handleFileSelection = async (file: File) => {
    setIssueError(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setIssueError('Please select a valid PDF certificate file.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const hash = computeSha256(bytes);

      setSelectedFile(file);
      setUploadedFileBytes(bytes);
      setComputedSha256(hash);

      const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, ' ');
      setFormData((prev) => ({
        ...prev,
        degree: prev.degree || cleanName.trim(),
      }));
    } catch {
      setIssueError('Failed to read and hash the selected certificate file.');
    }
  };

  // Compute live canonical payload SHA-256 hash when in generate mode
  useEffect(() => {
    if (issueMode === 'upload' && uploadedFileBytes) {
      return;
    }

    const payload = `${formData.studentId}|${formData.studentName}|${formData.degree}|${formData.department}|${formData.honors}|${formData.gpa}`;
    try {
      const realHash = ethers.sha256(ethers.toUtf8Bytes(payload));
      setComputedSha256(realHash);
    } catch {
      setComputedSha256('0x' + '0'.repeat(64));
    }
  }, [formData, issueMode, uploadedFileBytes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError(null);

    if (!formData.studentName.trim() || !formData.studentId.trim()) {
      setIssueError('Please provide both the Student Name and Student ID.');
      return;
    }

    if (issueMode === 'upload' && !selectedFile) {
      setIssueError('Please select or upload your certificate PDF file before submitting.');
      return;
    }

    const newCertId = formData.certId.trim() || `CERT-${Date.now().toString().slice(-6)}`;
    setIsMinting(true);

    try {
      let finalBytes: Uint8Array;
      let finalHash: string;

      if (issueMode === 'upload' && uploadedFileBytes) {
        finalBytes = uploadedFileBytes;
        finalHash = computedSha256.startsWith('0x') ? computedSha256 : `0x${computedSha256}`;
      } else {
        // Generate vector PDF
        finalBytes = await generateAcademicCertificatePdf({
          certId: newCertId,
          studentName: formData.studentName.trim(),
          studentId: formData.studentId.trim(),
          degree: formData.degree.trim() || 'Degree of Qualification',
          department: formData.department,
          honors: formData.honors === 'None' ? undefined : formData.honors,
          conferralDate: formData.date || 'June 16, 2024',
          issuerName: formData.issuer,
          issuerRole: formData.issuerRole,
          coSignerName: formData.coSigner,
          coSignerRole: formData.coSignerRole,
        });
        finalHash = computeSha256(finalBytes);
      }

      setDownloadPdfBytes(finalBytes);

      // Store in offline client vault
      await storeCertificateDocument(newCertId, finalBytes);
      await saveCertificateMetadata(newCertId, {
        id: newCertId,
        studentName: formData.studentName.trim(),
        studentId: formData.studentId.trim(),
        degree: formData.degree.trim() || 'Academic Credential',
        department: formData.department,
        honors: formData.honors === 'None' ? undefined : formData.honors,
        issueDate: formData.date || 'Today',
        documentHash: finalHash,
        issuer: formData.issuer,
        issuerRole: formData.issuerRole,
        coSigner: formData.coSigner,
        coSignerRole: formData.coSignerRole,
        status: 'Verified',
      });

      // Prepare payload to post to backend API (persists into MongoDB Atlas)
      const token = localStorage.getItem('certichain_token');
      const formDataToSend = new FormData();
      formDataToSend.append('id', newCertId);
      formDataToSend.append('studentName', formData.studentName.trim());
      formDataToSend.append('studentId', formData.studentId.trim());
      const studentIdClean = formData.studentId.trim().replace(/\s+/g, '').toLowerCase() || 'student';
      formDataToSend.append(
        'studentEmail',
        formData.studentEmail.trim() || `${studentIdClean}@university.edu`
      );
      formDataToSend.append('degree', formData.degree.trim() || 'Degree Qualification');
      formDataToSend.append('department', formData.department.trim() || 'Academic Affairs');
      formDataToSend.append('honors', formData.honors === 'None' ? '' : formData.honors);
      formDataToSend.append('date', formData.date || 'Today');
      formDataToSend.append('gpa', formData.gpa || '');
      formDataToSend.append('certHash', finalHash.toLowerCase().replace(/^0x/, ''));
      formDataToSend.append('coSigner', formData.coSigner);
      formDataToSend.append('coSignerRole', formData.coSignerRole);

      if (selectedFile) {
        formDataToSend.append('pdf', selectedFile);
      } else {
        const generatedBlob = new Blob([new Uint8Array(finalBytes) as unknown as BlobPart], { type: 'application/pdf' });
        formDataToSend.append('pdf', generatedBlob, `${newCertId}.pdf`);
      }

      // 1. Post to backend and persist into MongoDB Atlas
      const apiResponse = await fetch('/api/certificates', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formDataToSend,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        const detailedMsg =
          errorData.message ||
          (Array.isArray(errorData.details) ? errorData.details.join(', ') : 'Failed to save certificate in MongoDB database.');
        throw new Error(detailedMsg);
      }

      const apiData = await apiResponse.json();
      let finalCert: Certificate = apiData.certificate;

      // 2. If user requested blockchain anchoring, execute on-chain transaction if wallet is connected and authorized
      if (anchorOnBlockchain) {
        if (!isConnected) {
          console.info('MetaMask is not connected. Anchoring skipped; saved to verified database.');
        } else if (!isConfigured) {
          console.warn('Smart contract address is not configured in .env.');
        } else if (!isAuthorizedIssuer) {
          console.info(`Connected account (${account}) is not authorized on contract. Saved to verified registry.`);
        } else {
          try {
            if (isUnsupportedNetwork) {
              console.warn(`Wallet is on ${networkName}. Please switch to target network (Chain ID: ${targetChainId}).`);
            } else {
              // Real transaction approval via MetaMask
              const { txHash, blockNumber } = await issueCertificateOnChain(newCertId, finalHash);

              // Record real on-chain transaction receipt in MongoDB Atlas
              const anchorResponse = await fetch(`/api/certificates/${encodeURIComponent(newCertId)}/anchor`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  txHash: `${txHash.slice(0, 6)}...${txHash.slice(-4)}`,
                  fullTxHash: txHash,
                  blockNumber,
                  chainId: targetChainId,
                  contractAddress,
                }),
              });

              if (anchorResponse.ok) {
                const anchorData = await anchorResponse.json();
                if (anchorData.certificate) {
                  finalCert = anchorData.certificate;
                }
              }
            }
          } catch (chainErr: unknown) {
            console.warn('Smart contract anchoring skipped or cancelled:', chainErr);
            // Non-fatal notice: Certificate is still valid and issued
            setIssueError(
              `Certificate created in registry! Blockchain anchoring skipped: ${
                (chainErr as Error)?.message || 'Wallet transaction was not completed.'
              }`
            );
          }
        }
      }

      issueCertificate(finalCert);
      await refreshCertificates();
      setNewlyIssued(finalCert);
    } catch (err: unknown) {
      console.error('Issuance error:', err);
      setIssueError((err as Error)?.message || 'Failed to issue and anchor certificate.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-6xl mx-auto w-full">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stanford Registrar Portal</span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Issue Certificate
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Create and anchor verifiable credentials with SHA-256 integrity and Ethereum smart contracts.
          </p>
        </div>

        {/* Issuance Mode Pills */}
        <div className="inline-flex items-center bg-surface-container-low p-1 rounded-xl border border-surface-container text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIssueMode('upload')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              issueMode === 'upload'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Certificate</span>
          </button>
          <button
            type="button"
            onClick={() => setIssueMode('generate')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              issueMode === 'generate'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Generate</span>
          </button>
        </div>
      </div>

      {issueError && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{issueError}</span>
        </div>
      )}

      {/* Main Grid: Simple Form (Left) & Instant Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focused 3-Step Form */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-surface-container shadow-xs flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs">
            {/* Step 1: Certificate File / Document */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-on-surface uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white inline-flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>{issueMode === 'upload' ? 'Upload Certificate File (PDF)' : 'Official Parchment Diploma'}</span>
                </label>
                {selectedFile && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Ready
                  </span>
                )}
              </div>

              {issueMode === 'upload' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelection(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : selectedFile
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-surface-container bg-surface-container-low hover:bg-surface-container hover:border-primary/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelection(e.target.files[0]);
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface truncate text-xs">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-secondary">
                            {(selectedFile.size / 1024).toFixed(1)} KB • Exact SHA-256 computed
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setUploadedFileBytes(null);
                        }}
                        className="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-surface-container transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-secondary py-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface text-xs">
                          Choose or drop your certificate PDF here
                        </p>
                        <p className="text-[10px] text-outline mt-0.5">
                          Standard diploma, degree certificate, or transcript (Max 15MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface text-xs">Auto-Generated Vector Diploma</p>
                      <p className="text-[10px] text-secondary">High-resolution Stanford seal PDF will be created automatically.</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">Active</span>
                </div>
              )}
            </div>

            {/* Step 2: Essential Recipient Details */}
            <div className="flex flex-col gap-3.5">
              <label className="font-semibold text-on-surface uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white inline-flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Recipient Details</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-on-surface text-xs block mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="e.g. Imtiyaz Khan"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="font-medium text-on-surface text-xs block mb-1">
                    Student ID / Roll No *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="e.g. CS2022-0492"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-code-mono text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-on-surface text-xs block mb-1">
                  Degree / Award Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g. Bachelor of Science in Computer Science"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-on-surface text-xs block mb-1">
                    Certificate ID
                  </label>
                  <input
                    type="text"
                    value={formData.certId}
                    onChange={(e) => setFormData({ ...formData, certId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-code-mono text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="font-medium text-on-surface text-xs block mb-1">
                    Student Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    placeholder="student@stanford.edu"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Collapsible Additional Academic Metadata */}
            <div className="rounded-xl border border-surface-container overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full px-4 py-2.5 bg-surface-container-low/70 hover:bg-surface-container flex items-center justify-between text-left transition-colors"
              >
                <span className="font-semibold text-on-surface text-xs flex items-center gap-1.5">
                  <span className="text-secondary">Optional:</span>
                  <span>Honors, GPA & Department Details</span>
                </span>
                {showAdvancedOptions ? (
                  <ChevronUp className="w-4 h-4 text-secondary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-secondary" />
                )}
              </button>

              {showAdvancedOptions && (
                <div className="p-4 bg-surface-container-lowest flex flex-col gap-3.5 border-t border-surface-container">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-on-surface text-xs block mb-1">
                        Department / School
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="School of Engineering"
                        className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-on-surface text-xs block mb-1">
                        Academic Honors
                      </label>
                      <select
                        value={formData.honors}
                        onChange={(e) => setFormData({ ...formData, honors: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                      >
                        <option value="None">None</option>
                        <option value="First Class with Distinction">First Class with Distinction</option>
                        <option value="Summa Cum Laude">Summa Cum Laude</option>
                        <option value="Magna Cum Laude">Magna Cum Laude</option>
                        <option value="Cum Laude">Cum Laude</option>
                        <option value="Gold Medalist">Gold Medalist</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-on-surface text-xs block mb-1">
                        GPA / Score
                      </label>
                      <input
                        type="text"
                        value={formData.gpa}
                        onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                        placeholder="e.g. 3.94 / 4.00"
                        className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-on-surface text-xs block mb-1">
                        Co-Signer Name
                      </label>
                      <input
                        type="text"
                        value={formData.coSigner}
                        onChange={(e) => setFormData({ ...formData, coSigner: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Optional Blockchain Toggle */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2.5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={anchorOnBlockchain}
                  onChange={(e) => setAnchorOnBlockchain(e.target.checked)}
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">
                    Optional: Anchor on Ethereum Blockchain (MetaMask)
                  </span>
                  <span className="text-[11px] text-secondary">
                    Stores SHA-256 hash on smart contract (leave unchecked to issue directly to registry).
                  </span>
                </div>
              </label>

              {anchorOnBlockchain && (
                <div className="text-[11px] pt-1 border-t border-surface-container">
                  {!isConnected ? (
                    <div className="flex items-center justify-between text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span>MetaMask wallet not connected.</span>
                      <button
                        type="button"
                        onClick={connectWallet}
                        className="text-xs font-semibold underline text-primary"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  ) : !isAuthorizedIssuer ? (
                    <div className="text-slate-700 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 text-xs flex flex-col gap-1">
                      <span className="font-semibold text-amber-900">
                        Notice: Connected account ({account?.slice(0, 6)}...{account?.slice(-4)}) is not a contract owner.
                      </span>
                      <span className="text-[11px] text-amber-800">
                        Certificate will be issued to institutional registry with full SHA-256 cryptographic verification.
                      </span>
                    </div>
                  ) : (
                    <div className="text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Wallet Ready ({account?.slice(0, 6)}...{account?.slice(-4)})
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Ready to Sign</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isMinting}
              className="w-full h-11 text-sm font-semibold shadow-sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              {anchorOnBlockchain && isConnected && isAuthorizedIssuer
                ? 'Sign in MetaMask & Issue Certificate'
                : 'Issue Certificate'}
            </Button>
          </form>

          {/* Success Banner */}
          {newlyIssued && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col gap-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Certificate Successfully Issued!
                </span>
                <span className="font-code-mono text-xs px-2 py-0.5 rounded-full bg-emerald-200/60 font-semibold">
                  {newlyIssued.id}
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                {newlyIssued.fullTxHash ? (
                  <>Anchored on Ethereum in Block #{newlyIssued.blockNumber}. Tx: {newlyIssued.txHash}</>
                ) : (
                  <>Persisted securely into MongoDB database registry.</>
                )}
              </p>
              <div className="flex items-center gap-2 pt-1">
                {downloadPdfBytes && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([new Uint8Array(downloadPdfBytes) as unknown as BlobPart], {
                        type: 'application/pdf',
                      });
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
                  View Ledger
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Visual Diploma / File Card */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-outline">
              Real-Time Preview
            </span>
            <span className="text-[11px] font-code-mono text-primary font-semibold bg-surface-container px-2.5 py-0.5 rounded-full">
              {selectedFile ? 'Uploaded File' : 'Official Diploma'}
            </span>
          </div>

          {selectedFile ? (
            <div className="rounded-2xl p-7 border border-surface-container bg-surface-container-lowest text-center shadow-xs flex flex-col items-center justify-center gap-4 min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md w-full">
                <h3 className="font-headline-sm text-base font-bold text-on-surface truncate">
                  {selectedFile.name}
                </h3>
                <p className="text-xs text-secondary mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB • PDF Document
                </p>
                <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-surface-container text-left text-xs font-code-mono">
                  <span className="text-[10px] text-outline uppercase block font-semibold">
                    Computed SHA-256 Digest:
                  </span>
                  <span className="text-primary text-[11px] break-all block mt-0.5">
                    {computedSha256}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-secondary max-w-sm">
                This exact file is cryptographically hashed and recorded into MongoDB Atlas and the blockchain registry.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl p-7 sm:p-8 border border-slate-200/90 relative overflow-hidden bg-white text-center shadow-sm flex flex-col items-center">
              {/* Crest */}
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-brand-gold/40 flex items-center justify-center shadow-xs mb-2">
                <Award className="w-6 h-6 text-brand-gold" />
              </div>
              <h2 className="font-headline-lg text-lg font-bold tracking-tight text-on-surface uppercase">
                Stanford University
              </h2>
              <span className="text-[9px] text-outline uppercase tracking-[0.2em] font-semibold block mb-4">
                Office of the University Registrar
              </span>

              {/* Recipient Notice */}
              <p className="text-secondary font-serif italic text-xs mb-1">
                Conferred upon
              </p>
              <h1 className="font-display-hero text-xl font-bold text-on-surface tracking-tight mb-1">
                {formData.studentName || 'Recipient Full Name'}
              </h1>
              <p className="text-[10px] font-code-mono text-outline mb-3">
                ID: {formData.studentId || 'STUDENT-UID'}
              </p>

              {/* Degree */}
              <p className="text-secondary font-serif italic text-xs">the degree of</p>
              <p className="font-headline-lg text-sm font-bold text-primary mt-0.5 mb-1">
                {formData.degree || 'Degree Program'}
              </p>

              {formData.honors && formData.honors !== 'None' && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold border border-brand-gold/30 mb-3">
                  <Award className="w-3 h-3 text-brand-gold" />
                  <span>{formData.honors}</span>
                </div>
              )}

              {/* Live Hash Badge */}
              <div className="w-full mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-left text-[11px]">
                <div>
                  <span className="font-serif italic text-primary text-xs">
                    {formData.issuer || currentUser?.name || 'Institutional Registrar'}
                  </span>
                  <p className="text-[9px] text-outline font-semibold">University Registrar</p>
                </div>
                <div className="text-right">
                  <span className="font-code-mono text-[10px] text-outline block">SHA-256 Digest</span>
                  <span className="font-code-mono text-[10px] text-primary font-semibold">
                    {computedSha256 ? `${computedSha256.slice(0, 10)}...` : 'Computing...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
