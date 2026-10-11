import React, { useState } from 'react';
import type { Student, Certificate } from '../types';

interface StudentsViewProps {
  students: Student[];
  certificates: Certificate[];
  onInspectCertificate: (cert: Certificate) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  certificates,
  onInspectCertificate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('All');

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentUid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFaculty =
      facultyFilter === 'All' || student.faculty.toLowerCase().includes(facultyFilter.toLowerCase());

    return matchesSearch && matchesFaculty;
  });

  return (
    <div className="flex flex-col w-full pb-space-xl gap-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-space-xs">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Enrolled & Graduated Students Registry
          </h1>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Directory of matriculated candidates, decentralized DID identifiers, and on-chain credential portfolios.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-code-mono text-xs font-semibold w-fit border border-surface-container-high">
          <span>Total Registered: 892 Students</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search by student name, UID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-outline">Faculty:</span>
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="h-9 px-2 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
          >
            <option value="All">All Faculties</option>
            <option value="Engineering">School of Engineering</option>
            <option value="Law">Stanford Law School</option>
            <option value="Medicine">School of Medicine</option>
            <option value="Humanities">Humanities & Sciences</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4 font-semibold">Student Name & Avatar</th>
                <th className="py-3 px-4 font-semibold">Matriculation UID</th>
                <th className="py-3 px-4 font-semibold">Faculty & Program</th>
                <th className="py-3 px-4 font-semibold">Standing</th>
                <th className="py-3 px-4 font-semibold">Wallet Address</th>
                <th className="py-3 px-4 font-semibold">Credentials</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
              {filteredStudents.map((stu) => {
                const stuCerts = certificates.filter((c) => c.studentId === stu.studentUid);
                return (
                  <tr key={stu.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {stu.avatar ? (
                          <img
                            src={stu.avatar}
                            alt={stu.name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-surface-container"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-bold text-xs">
                            {stu.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-xs text-on-surface block">
                            {stu.name}
                          </span>
                          <span className="text-[11px] text-outline block">{stu.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-code-mono text-xs text-on-surface">
                      {stu.studentUid}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs text-on-surface font-medium block">
                        {stu.program}
                      </span>
                      <span className="text-[11px] text-secondary block">{stu.faculty}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-primary text-[11px] font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                        {stu.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-code-mono text-xs text-outline">
                      {stu.walletAddress}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-code-mono text-xs font-semibold">
                        {stuCerts.length || stu.totalCertificates} On-Chain
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {stuCerts.length > 0 ? (
                        <button
                          onClick={() => onInspectCertificate(stuCerts[0])}
                          className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>View Diploma</span>
                        </button>
                      ) : (
                        <span className="text-outline text-xs">Archived</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
