import React, { useState } from 'react';
import type { Signer } from '../types';

interface SettingsViewProps {
  signers: Signer[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ signers }) => {
  const [network, setNetwork] = useState('Ethereum Mainnet');
  const [quorum, setQuorum] = useState('3-of-5');
  const [gasThreshold, setGasThreshold] = useState('25');
  const [merkleEpochHours, setMerkleEpochHours] = useState('6');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col w-full pb-space-xl gap-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-space-xs">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Governance & Network Settings
          </h1>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Configure Multi-Sig custodian quorum, smart contract parameters, and zero-knowledge batch frequencies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left: General Settings */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-xs flex flex-col gap-5">
          <h2 className="font-headline-sm text-base font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">tune</span>
            <span>Ledger & Protocol Configuration</span>
          </h2>

          <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Settlement Blockchain Network
              </label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-brand-teal"
              >
                <option value="Ethereum Mainnet">Ethereum Mainnet (Chain ID 1)</option>
                <option value="Polygon PoS">Polygon PoS (Chain ID 137)</option>
                <option value="Arbitrum One">Arbitrum One (Chain ID 42161)</option>
                <option value="Sepolia Testnet">Sepolia Testnet (Auditing)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Multi-Sig Quorum Requirement
                </label>
                <select
                  value={quorum}
                  onChange={(e) => setQuorum(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-brand-teal"
                >
                  <option value="3-of-5">3-of-5 Quorum (Standard University Governance)</option>
                  <option value="4-of-5">4-of-5 Quorum (High Strictness)</option>
                  <option value="2-of-3">2-of-3 Quorum (Fast Track)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Max Gas Limit (Gwei)
                </label>
                <input
                  type="number"
                  value={gasThreshold}
                  onChange={(e) => setGasThreshold(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface font-code-mono focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-on-surface uppercase tracking-wider block mb-1">
                Merkle Tree Epoch Anchor Interval (Hours)
              </label>
              <input
                type="number"
                value={merkleEpochHours}
                onChange={(e) => setMerkleEpochHours(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface font-code-mono focus:outline-none focus:border-brand-teal"
              />
              <span className="text-[11px] text-outline mt-1 block">
                Batches are automatically hashed and anchored into the root smart contract every {merkleEpochHours} hours.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-primary font-semibold text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Settings saved successfully!
                </span>
              ) : (
                <span></span>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-semibold text-xs transition-colors"
              >
                Save Protocol Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right: Custodian Signers */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-xs flex flex-col gap-4">
          <h2 className="font-headline-sm text-base font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-xl">key</span>
            <span>Authorized Hardware Key Custodians</span>
          </h2>
          <p className="text-xs text-secondary">
            Signers required for major contract state mutations and graduation epoch anchors.
          </p>

          <div className="flex flex-col gap-3">
            {signers.map((sig) => (
              <div
                key={sig.id}
                className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      sig.status === 'Signed'
                        ? 'bg-primary text-white'
                        : 'bg-tertiary-fixed text-tertiary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {sig.status === 'Signed' ? 'check' : 'pending'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-on-surface block">{sig.name}</span>
                    <span className="text-[11px] text-outline block">{sig.role}</span>
                  </div>
                </div>
                <span className="text-[11px] font-code-mono font-semibold px-2 py-0.5 rounded bg-surface-container text-primary">
                  Active
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1 text-[11px] text-secondary mt-2">
            <span className="font-semibold text-on-surface">Emergency Revocation Circuit Breaker</span>
            <span>
              In event of credential compromise, an M-of-N quorum can execute immediate revocation nonces via timelock smart contracts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
