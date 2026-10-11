import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Button } from './ui/Button';
import {
  X,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Network,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({ isOpen, onClose }) => {
  const {
    account,
    chainId,
    networkName,
    balance,
    isUnsupportedNetwork,
    targetChainId,
    contractAddress,
    isConfigured,
    explorerUrl,
    isAuthorizedIssuer,
    isAdmin,
    isCheckingRoles,
    disconnectWallet,
    switchNetwork,
  } = useWeb3();

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  if (!isOpen || !account) return null;

  const copyToClipboard = (text: string, type: 'account' | 'contract') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-container-lowest border border-surface-container rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Web3 Wallet Connection
              </h3>
              <p className="text-xs text-secondary">
                Connected via MetaMask / Browser Extension
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 text-xs">
          {/* Unsupported Network Warning */}
          {isUnsupportedNetwork && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-xs">Unsupported Network Detected</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  You are connected to Chain #{chainId} ({networkName}), but CertiChain expects Chain #{targetChainId} (Ethereum Sepolia).
                </p>
                <button
                  onClick={() => switchNetwork()}
                  className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Switch to Sepolia Network
                </button>
              </div>
            </div>
          )}

          {/* Account Address Box */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Connected Account
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-code-mono text-xs font-bold text-on-surface break-all">
                {account}
              </span>
              <button
                onClick={() => copyToClipboard(account, 'account')}
                className="p-1.5 rounded-md hover:bg-surface-container text-secondary hover:text-on-surface transition-colors shrink-0"
                title="Copy Address"
              >
                {copiedAccount ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {explorerUrl && (
              <a
                href={`${explorerUrl}/address/${account}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1 self-start font-medium"
              >
                View on Block Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Network & Balance Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-outline font-semibold flex items-center gap-1">
                <Network className="w-3 h-3" /> Network
              </span>
              <span className="font-semibold text-on-surface text-xs truncate">
                {networkName}
              </span>
              <span className="text-[10px] text-secondary font-code-mono">
                Chain ID: {chainId || 'N/A'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-outline font-semibold">
                Native Balance
              </span>
              <span className="font-code-mono font-bold text-on-surface text-xs">
                {balance ? `${balance} ETH` : 'Loading...'}
              </span>
              <span className="text-[10px] text-primary font-medium">Gas Ready</span>
            </div>
          </div>

          {/* On-Chain Permissions */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2.5">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> On-Chain Contract Permissions
            </span>

            {isCheckingRoles ? (
              <div className="text-secondary text-xs animate-pulse">
                Querying smart contract roles for your account...
              </div>
            ) : !isConfigured ? (
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Contract address not configured in .env. Operating in testnet simulation mode.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-surface-container">
                  <span className="text-secondary">Authorized Certificate Issuer:</span>
                  {isAuthorizedIssuer ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold font-code-mono text-[11px] border border-emerald-500/20">
                      ✓ AUTHORIZED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-surface-container text-outline font-code-mono text-[11px]">
                      NOT AUTHORIZED
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-surface-container">
                  <span className="text-secondary">Registry Administrator:</span>
                  {isAdmin ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold font-code-mono text-[11px] border border-emerald-500/20">
                      ✓ ADMIN PRIVILEGES
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-surface-container text-outline font-code-mono text-[11px]">
                      REGULAR ACCOUNT
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Configured Contract Info */}
          <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-outline font-semibold">
              Registry Contract
            </span>
            {contractAddress ? (
              <div className="flex items-center justify-between gap-2">
                <span className="font-code-mono text-[11px] text-on-surface truncate">
                  {contractAddress}
                </span>
                <button
                  onClick={() => copyToClipboard(contractAddress, 'contract')}
                  className="p-1 rounded text-outline hover:text-on-surface"
                  title="Copy Contract Address"
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-secondary italic">
                Pending deployment address in VITE_CERTICHAIN_CONTRACT_ADDRESS
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-container bg-surface-container-low/40 flex items-center justify-between gap-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Disconnect Wallet
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
