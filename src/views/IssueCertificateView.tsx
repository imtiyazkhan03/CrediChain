import React, { useState } from 'react';
import type { Certificate } from '../types';

interface IssueCertificateViewProps {
  onIssueSuccess: (newCert: Certificate) => void;
  onInspectCertificate: (cert: Certificate) => void;
}

export const IssueCertificateView: React.FC<IssueCertificateViewProps> = ({
  onIssueSuccess,
  onInspectCertificate,
}) => {
  const [formData, setFormData] = useState({
    studentName: 'Julianne Adams',
    studentId: 'SU-2022-4819',
    department: 'School of Engineering',
    degree: 'B.S. in Computer Science (Systems)',
    honors: 'Summa Cum Laude',
    gpa: '3.96 / 4.00',
    issuer: 'Dr. Evelyn Vance',
    issuerRole: 'University Registrar & Custodian',
    coSigner: 'Prof. Julian Thorpe',
    coSignerRole: 'Dean of Academic Affairs',
  });

  const [isMinting, setIsMinting] = useState(false);
  const [issuedResult, setIssuedResult] = useState<Certificate | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.studentId.trim()) return;

    setIsMinting(true);

    setTimeout(() => {
      setIsMinting(false);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newCert: Certificate = {
        id: `CERT-2024-${randomSuffix}`,
        txHash: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
        fullTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        certHash: `${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        studentName: formData.studentName,
        studentId: formData.studentId,
        studentInitials: formData.studentName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        degree: formData.degree,
        department: formData.department,
        honors: formData.honors === 'None' ? undefined : formData.honors,
        date: 'Mar 14, 2024',
        mintedDate: new Date().toUTCString(),
        blockNumber: 19842111,
        status: 'Verified',
        merkleRoot: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        ipfsCid: `ipfs://bafybei${Math.random().toString(36).substring(2, 15)}`,
        issuer: formData.issuer,
        issuerRole: formData.issuerRole,
        coSigner: formData.coSigner,
        coSignerRole: formData.coSignerRole,
        gpa: formData.gpa,
      };

      onIssueSuccess(newCert);
      setIssuedResult(newCert);
    }, 900);
  };

  return (
    <div className="flex flex-col w-full pb-space-xl gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
          Issue Cryptographic Degree Attestation
        </h1>
        <p className="font-body-md text-body-md text-secondary mt-1">
          Mint tamper-evident credentials directly to the Stanford University registrar registry smart contract.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left: Form Controls */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-surface-container flex flex-col gap-4">
          <h2 className="font-headline-sm text-base font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">edit_document</span>
            <span>Credential Parameters</span>
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Student Full Name
              </label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Student UID / Matriculation ID
              </label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm font-code-mono text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              />
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
                Degree & Major
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
                  Honors
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
                  GPA
                </label>
                <input
                  type="text"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs font-code-mono text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
            </div>

            {/* Hardware Key Check */}
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">key</span>
                <span className="text-[11px] text-on-surface font-medium">Hardware FIDO2 Security Key</span>
              </div>
              <span className="text-primary font-semibold text-[11px]">Ready</span>
            </div>

            <button
              type="submit"
              disabled={isMinting}
              className="mt-2 h-11 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {isMinting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Generating ZK Proof & Anchoring...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Mint & Attest to Ethereum Mainnet</span>
                </>
              )}
            </button>
          </form>

          {issuedResult && (
            <div className="p-4 rounded-xl bg-surface-container-highest border border-primary/20 flex flex-col gap-2 mt-2 animate-in fade-in">
              <div className="flex items-center justify-between text-primary font-semibold text-xs">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Attestation Committed Successfully!
                </span>
                <span className="font-code-mono">{issuedResult.id}</span>
              </div>
              <p className="text-[11px] text-on-surface">
                Signed by Dr. Evelyn Vance & added to active Merkle epoch #412.
              </p>
              <button
                onClick={() => onInspectCertificate(issuedResult)}
                className="mt-1 w-full py-1.5 rounded-lg bg-primary text-white text-xs font-semibold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                Inspect Official Parchment
              </button>
            </div>
          )}
        </div>

        {/* Right: Live Interactive Parchment Preview */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-outline">
              Real-time Diploma Rendering Preview
            </span>
            <span className="text-[11px] font-code-mono text-primary font-semibold bg-surface-container px-2 py-0.5 rounded-full">
              Live Preview
            </span>
          </div>

          <div className="parchment-canvas rounded-xl p-8 sm:p-10 border border-[#e2e8f0] relative overflow-hidden bg-white text-center shadow-lg">
            {/* Crest */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div className="w-14 h-14 rounded-full bg-surface-container-low border-2 border-brand-gold/40 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-2xl text-brand-gold">account_balance</span>
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
                <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-tertiary text-[11px] font-semibold border border-brand-gold/30">
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
                <span className="material-symbols-outlined text-brand-gold text-base">verified</span>
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
