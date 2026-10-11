import React, { useState } from 'react';
import type { Certificate } from '../types';

interface CertificatesViewProps {
  certificates: Certificate[];
  onInspectCertificate: (cert: Certificate) => void;
  onOpenIssueModal: () => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  onInspectCertificate,
  onOpenIssueModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const departments = [
    'All',
    'School of Engineering',
    'Stanford Law School',
    'School of Medicine',
    'School of Humanities and Sciences',
    'Stanford Graduate School of Business',
  ];

  const filteredCerts = certificates.filter((cert) => {
    const matchesSearch =
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.degree.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'All' || cert.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || cert.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full pb-space-xl gap-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-space-xs">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Academic Credentials Ledger
          </h1>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Browse and inspect all accredited degree attestations registered to Stanford University smart contracts.
          </p>
        </div>
        <button
          onClick={onOpenIssueModal}
          className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs shadow-xs transition-all w-fit"
        >
          <span className="material-symbols-outlined text-sm">add_moderator</span>
          <span>Issue New Credential</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search by student, ID, degree..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-outline">
            <span>Faculty:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 px-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-outline">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Revoked">Revoked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4 font-semibold">Certificate ID</th>
                <th className="py-3 px-4 font-semibold">Student Name & UID</th>
                <th className="py-3 px-4 font-semibold">Faculty & Degree</th>
                <th className="py-3 px-4 font-semibold">Academic Honors</th>
                <th className="py-3 px-4 font-semibold">Block / Date</th>
                <th className="py-3 px-4 font-semibold">Ledger Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-secondary text-xs">
                    No certificates matched your criteria.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-code-mono text-code-mono font-semibold text-on-surface block">
                        {cert.id}
                      </span>
                      <span className="font-code-mono text-primary text-xs truncate max-w-[120px] block">
                        {cert.txHash}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {cert.studentAvatar ? (
                          <img
                            src={cert.studentAvatar}
                            alt={cert.studentName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-surface-container"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-semibold text-xs">
                            {cert.studentInitials || cert.studentName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-on-surface text-xs block">
                            {cert.studentName}
                          </span>
                          <span className="font-code-mono text-outline text-[11px]">
                            {cert.studentId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-on-surface font-medium text-xs block max-w-xs truncate">
                        {cert.degree}
                      </span>
                      <span className="text-secondary text-[11px] block">{cert.department}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {cert.honors ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary text-[11px] font-semibold border border-brand-gold/30">
                          <span className="material-symbols-outlined text-xs">military_tech</span>
                          {cert.honors}
                        </span>
                      ) : (
                        <span className="text-outline text-xs">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-on-surface text-xs block">{cert.date}</span>
                      <span className="font-code-mono text-outline text-[11px]">
                        Block #{cert.blockNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {cert.status === 'Verified' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-primary text-xs font-semibold">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                          Verified
                        </span>
                      )}
                      {cert.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-tertiary text-xs font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse mr-1"></span>
                          Pending
                        </span>
                      )}
                      {cert.status === 'Revoked' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-error text-xs font-semibold">
                          <span className="material-symbols-outlined text-xs">block</span>
                          Revoked
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onInspectCertificate(cert)}
                        className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
