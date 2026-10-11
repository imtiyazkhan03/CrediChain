import React from 'react';
import type { VerificationLog, Certificate } from '../types';

interface VerificationHistoryViewProps {
  logs: VerificationLog[];
  certificates: Certificate[];
  onOpenVerifyModal: () => void;
  onInspectCertificate: (cert: Certificate) => void;
}

export const VerificationHistoryView: React.FC<VerificationHistoryViewProps> = ({
  logs,
  certificates,
  onOpenVerifyModal,
  onInspectCertificate,
}) => {
  return (
    <div className="flex flex-col w-full pb-space-xl gap-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-space-xs">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Cryptographic Verification Audit Ledger
          </h1>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Real-time query log of external employer verifications, ZK-Snark attestations, and public QR scans.
          </p>
        </div>
        <button
          onClick={onOpenVerifyModal}
          className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs shadow-xs transition-all w-fit"
        >
          <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
          <span>Verify Document Hash</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-outline font-semibold">
              Total Verifications (30D)
            </span>
            <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
          </div>
          <span className="text-2xl font-bold text-on-surface block mt-2">1,240</span>
          <span className="text-[11px] text-primary mt-1 block">99.4% Instant Resolution</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-outline font-semibold">
              Average ZK-SNARK Latency
            </span>
            <span className="material-symbols-outlined text-primary text-xl">speed</span>
          </div>
          <span className="text-2xl font-bold text-on-surface block mt-2">312 ms</span>
          <span className="text-[11px] text-outline mt-1 block">Zero personally identifiable data leak</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-outline font-semibold">
              Nullified / Tampered Attempts
            </span>
            <span className="material-symbols-outlined text-error text-xl">gpp_bad</span>
          </div>
          <span className="text-2xl font-bold text-on-surface block mt-2">1 Blocked</span>
          <span className="text-[11px] text-secondary mt-1 block">Audit trail permanently recorded</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container overflow-hidden">
        <div className="p-4 border-b border-surface-container flex items-center justify-between">
          <h2 className="font-semibold text-sm text-on-surface">External Query Audit Events</h2>
          <span className="text-xs text-outline font-code-mono">Auto-refreshed via Webhook</span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4 font-semibold">Querying Entity / Verifier</th>
                <th className="py-3 px-4 font-semibold">Certificate Target</th>
                <th className="py-3 px-4 font-semibold">Verification Method</th>
                <th className="py-3 px-4 font-semibold">Result</th>
                <th className="py-3 px-4 font-semibold">Latency</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
              {logs.map((log) => {
                const targetCert = certificates.find((c) => c.id === log.certId);
                return (
                  <tr key={log.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-xs text-on-surface block">
                        {log.verifier}
                      </span>
                      <span className="text-[11px] text-outline block">{log.location}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-code-mono text-xs font-semibold text-primary block">
                        {log.certId}
                      </span>
                      <span className="text-[11px] text-on-surface block">{log.studentName}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-secondary">
                        <span className="material-symbols-outlined text-sm">lock_open</span>
                        {log.method}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {log.result === 'Valid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-primary text-xs font-semibold">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-error text-xs font-semibold">
                          <span className="material-symbols-outlined text-xs">block</span>
                          {log.result}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-code-mono text-xs text-outline">
                      {log.latency}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-secondary">
                      {log.timestamp}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {targetCert && (
                        <button
                          onClick={() => onInspectCertificate(targetCert)}
                          className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Inspect</span>
                        </button>
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
