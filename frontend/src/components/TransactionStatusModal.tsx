import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Button } from './ui/Button';
import {
  Loader2,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  X,
} from 'lucide-react';

export const TransactionStatusModal: React.FC = () => {
  const { currentTx, clearCurrentTx, explorerUrl } = useWeb3();
  const [copied, setCopied] = React.useState(false);

  if (!currentTx || currentTx.state === 'idle') return null;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low/40">
          <span className="text-xs font-bold uppercase tracking-wider text-outline">
            Blockchain Transaction Monitor
          </span>
          {currentTx.state !== 'pending' && (
            <button
              onClick={clearCurrentTx}
              className="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content based on state */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          {/* PENDING STATE */}
          {currentTx.state === 'pending' && (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  {currentTx.actionTitle || 'Transaction In Flight'}
                </h3>
                <p className="text-xs text-secondary mt-1">
                  {currentTx.details || 'Awaiting block confirmation on Ethereum...'}
                </p>
              </div>

              {currentTx.txHash && (
                <div className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] uppercase font-semibold text-outline">
                    Transaction Hash
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-code-mono text-xs text-on-surface truncate">
                      {currentTx.txHash}
                    </span>
                    <button
                      onClick={() => copyHash(currentTx.txHash!)}
                      className="p-1 rounded hover:bg-surface-container text-secondary shrink-0"
                      title="Copy Hash"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {explorerUrl && (
                    <a
                      href={`${explorerUrl}/tx/${currentTx.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                    >
                      View on Etherscan <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <p className="text-[11px] text-outline italic">
                Please do not close this window while the EVM processes your transaction.
              </p>
            </>
          )}

          {/* CONFIRMED STATE */}
          {currentTx.state === 'confirmed' && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  {currentTx.actionTitle || 'Transaction Confirmed!'}
                </h3>
                <p className="text-xs text-secondary mt-1">
                  {currentTx.details || 'Successfully verified and stored in smart contract state.'}
                </p>
              </div>

              {currentTx.txHash && (
                <div className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] uppercase font-semibold text-outline">
                    Confirmed Transaction
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-code-mono text-xs text-on-surface truncate">
                      {currentTx.txHash}
                    </span>
                    <button
                      onClick={() => copyHash(currentTx.txHash!)}
                      className="p-1 rounded hover:bg-surface-container text-secondary shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {currentTx.blockNumber && (
                    <span className="text-[11px] text-secondary font-code-mono">
                      Mined in Block #{currentTx.blockNumber}
                    </span>
                  )}
                  {explorerUrl && (
                    <a
                      href={`${explorerUrl}/tx/${currentTx.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                    >
                      Verify on Block Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <Button variant="primary" size="sm" onClick={clearCurrentTx} className="w-full mt-2">
                Continue
              </Button>
            </>
          )}

          {/* REJECTED STATE */}
          {currentTx.state === 'rejected' && (
            <>
              <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <AlertOctagon className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  {currentTx.actionTitle || 'Transaction Rejected'}
                </h3>
                <p className="text-xs text-secondary mt-1">
                  {currentTx.errorMessage || 'You rejected the transaction signature in your wallet.'}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={clearCurrentTx} className="w-full mt-2">
                Dismiss
              </Button>
            </>
          )}

          {/* FAILED STATE */}
          {currentTx.state === 'failed' && (
            <>
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <XCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-headline-sm text-base font-bold text-rose-700 dark:text-rose-400">
                  {currentTx.actionTitle || 'Transaction Failed'}
                </h3>
                <p className="text-xs text-rose-600/90 dark:text-rose-300/90 mt-1 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 font-code-mono break-all text-left">
                  {currentTx.errorMessage || 'Transaction reverted during EVM execution.'}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={clearCurrentTx} className="w-full mt-2">
                Close & Review
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
