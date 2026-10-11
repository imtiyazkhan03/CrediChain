import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCertificates } from '../contexts/CertificateContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Certificate } from '../types';
import {
  Search,
  PlusCircle,
  FileDown,
  Eye,
  QrCode,
  Trash2,
  Copy,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AdminCertificatesPageProps {
  onInspect: (cert: Certificate) => void;
  onRevoke: (cert: Certificate) => void;
  onShowQR: (cert: Certificate) => void;
}

export const AdminCertificatesPage: React.FC<AdminCertificatesPageProps> = ({
  onInspect,
  onRevoke,
  onShowQR,
}) => {
  const { certificates } = useCertificates();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const navigate = useNavigate();

  // Reset pagination on filter change
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };
  const handleDeptChange = (val: string) => {
    setDeptFilter(val);
    setCurrentPage(1);
  };
  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

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
      cert.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.txHash && cert.txHash.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = deptFilter === 'All' || cert.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || cert.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCerts.length / pageSize));
  const paginatedCerts = filteredCerts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCSV = () => {
    const headers = 'Certificate ID,Student Name,Student ID,Degree,Department,Honors,Block,Status,Hash\n';
    const rows = filteredCerts
      .map(
        (c) =>
          `"${c.id}","${c.studentName}","${c.studentId}","${c.degree}","${c.department}","${c.honors || 'N/A'}","${c.blockNumber}","${c.status}","${c.txHash}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CertiChain_Registry_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Institutional Certificates Ledger
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Complete cryptographic audit trail of all accredited degrees anchored to Stanford registry contracts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileDown className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/issue')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Issue New Degree
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, ID, degree, or hash..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-outline">Faculty:</span>
            <select
              value={deptFilter}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="h-9 px-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-outline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
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

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low text-outline font-semibold uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4">Certificate ID & Hash</th>
                <th className="py-3 px-4">Student & UID</th>
                <th className="py-3 px-4">Degree & Faculty</th>
                <th className="py-3 px-4">Academic Honors</th>
                <th className="py-3 px-4">Minted Block</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-outline">
                      <AlertCircle className="w-8 h-8 text-secondary" />
                      <p className="font-semibold text-sm text-on-surface">No Certificates Found</p>
                      <p className="text-xs">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-surface-container-low/60 transition-colors">
                    {/* ID & Hash */}
                    <td className="py-3 px-4">
                      <span className="font-code-mono font-semibold text-on-surface block">
                        {cert.id}
                      </span>
                      <button
                        onClick={() => copyHash(cert.txHash)}
                        className="inline-flex items-center gap-1 font-code-mono text-primary text-[11px] hover:underline"
                        title="Copy Tx Hash"
                      >
                        <span>{copiedHash === cert.txHash ? 'Copied!' : cert.txHash}</span>
                        <Copy className="w-3 h-3 text-outline" />
                      </button>
                    </td>

                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {cert.studentAvatar ? (
                          <img
                            src={cert.studentAvatar}
                            alt={cert.studentName}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-surface-container"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-bold text-[10px]">
                            {cert.studentInitials || cert.studentName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-on-surface block truncate max-w-[130px]">
                            {cert.studentName}
                          </span>
                          <span className="font-code-mono text-outline text-[10px] block">
                            {cert.studentId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Degree */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-on-surface block truncate max-w-[220px]">
                        {cert.degree}
                      </span>
                      <span className="text-[11px] text-secondary block truncate max-w-[220px]">
                        {cert.department}
                      </span>
                    </td>

                    {/* Honors */}
                    <td className="py-3 px-4">
                      {cert.honors ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                          <span className="material-symbols-outlined text-[12px]">military_tech</span>
                          {cert.honors}
                        </span>
                      ) : (
                        <span className="text-outline text-xs">—</span>
                      )}
                    </td>

                    {/* Block */}
                    <td className="py-3 px-4">
                      <span className="text-on-surface block">{cert.date}</span>
                      <span className="font-code-mono text-outline text-[10px]">
                        Block #{cert.blockNumber}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          cert.status === 'Verified'
                            ? 'verified'
                            : cert.status === 'Pending'
                            ? 'pending'
                            : 'revoked'
                        }
                        size="sm"
                      >
                        {cert.status}
                      </Badge>
                      {cert.status === 'Revoked' && cert.revocationReason && (
                        <span className="text-[10px] text-error block mt-0.5 truncate max-w-[150px]">
                          {cert.revocationReason}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onShowQR(cert)}
                          className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
                          title="Show Verification QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onInspect(cert)}
                          className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
                          title="Inspect Official Parchment Diploma"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {cert.status !== 'Revoked' && (
                          <button
                            onClick={() => onRevoke(cert)}
                            className="p-1.5 rounded hover:bg-rose-50 text-secondary hover:text-error transition-colors"
                            title="Revoke Certificate On-Chain"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-surface-container-low/40 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-on-surface">
                {filteredCerts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-on-surface">
                {Math.min(currentPage * pageSize, filteredCerts.length)}
              </strong>{' '}
              of <strong className="text-on-surface">{filteredCerts.length}</strong> certificates
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-outline">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 px-1.5 rounded bg-surface-container-lowest border border-surface-container text-xs text-on-surface focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 rounded-lg bg-surface-container font-semibold text-on-surface">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
