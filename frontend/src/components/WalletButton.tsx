import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { WalletDetailsModal } from './WalletDetailsModal';
import { Wallet, AlertTriangle, Loader2 } from 'lucide-react';

export const WalletButton: React.FC = () => {
  const {
    account,
    balance,
    isConnecting,
    isConnected,
    isUnsupportedNetwork,
    connectWallet,
  } = useWeb3();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (!isConnected) {
      connectWallet();
    } else {
      setIsModalOpen(true);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      {isUnsupportedNetwork ? (
        <button
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-code-mono text-xs font-semibold border border-amber-500/30 transition-all shadow-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span className="hidden sm:inline">Wrong Network</span>
          <span className="sm:hidden">Switch</span>
        </button>
      ) : isConnecting ? (
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-outline font-code-mono text-xs border border-surface-container-high cursor-not-allowed opacity-80"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>Connecting...</span>
        </button>
      ) : isConnected && account ? (
        <button
          onClick={handleClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-code-mono text-on-surface border border-surface-container-high transition-all group shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-primary">{formatAddress(account)}</span>
          {balance && (
            <span className="hidden md:inline text-secondary font-medium pl-1 border-l border-surface-container-high">
              {balance} ETH
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Connect Wallet</span>
        </button>
      )}

      <WalletDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
