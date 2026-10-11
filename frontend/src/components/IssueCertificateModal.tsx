import React, { useState } from 'react';
import type { Certificate } from '../types';

interface IssueCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueSuccess: (newCert: Certificate) => void;
}

export const IssueCertificateModal: React.FC<IssueCertificateModalProps> = ({
  isOpen,
  onClose,
  onIssueSuccess,
}) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    department: 'School of Engineering',
    degree: 'B.S. in Computer Science',
    honors: 'Magna Cum Laude',
    gpa: '3.92 / 4.00',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.studentId.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

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
        date: 'Today',
        mintedDate: new Date().toUTCString(),
        blockNumber: 19842110,
        status: 'Verified',
        merkleRoot: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        ipfsCid: `ipfs://bafybei${Math.random().toString(36).substring(2, 15)}`,
        issuer: 'Dr. Evelyn Vance',
        issuerRole: 'University Registrar & Custodian',
        coSigner: 'Prof. Julian Thorpe',
        coSignerRole: 'Dean of Academic Affairs',
        gpa: formData.gpa,
      };

      onIssueSuccess(newCert);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-16 px-6 bg-inverse-surface text-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-on-primary">
              <span className="material-symbols-outlined text-xl">add_moderator</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base text-surface-container-lowest font-semibold">
                Issue Cryptographic Degree Attestation
              </h3>
              <p className="text-[11px] text-outline-variant">
                Direct attestation to ERC-721 Accredited Registry
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="e.g. Maya Lin"
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Student UID / ID *
              </label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. SU-2021-9820"
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-sm font-code-mono text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="Stanford Doerr School of Sustainability">Stanford Doerr School of Sustainability</option>
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
                placeholder="e.g. M.S. in Aeronautics & Astronautics"
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="Order of the Coif">Order of the Coif</option>
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
                placeholder="e.g. 3.95 / 4.00"
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs font-code-mono text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
              />
            </div>
          </div>

          {/* Cryptographic Signing summary banner */}
          <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">
              shield
            </span>
            <div className="flex flex-col text-[11px] text-secondary">
              <span className="font-semibold text-on-surface">Cryptographic Attestation Parameters</span>
              <span>
                Signed with Custodian Key (0x92c...881f) · Poseidon Merkle Leaf · IPFS metadata pin ready.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-surface-container hover:bg-surface-container text-xs font-medium text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Minting Attestation...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Commit Certificate On-Chain</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
