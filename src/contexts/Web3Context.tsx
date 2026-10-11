import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  ACADEMIC_CERTIFICATE_REGISTRY_ABI,
  SUPPORTED_NETWORKS,
  getContractAddress,
  isContractConfigured,
} from '../config/contractConfig';
import type { TransactionInfo, OnChainCertificateRecord } from '../types';

interface Web3ContextType {
  // Wallet Connection State
  account: string | null;
  chainId: number | null;
  networkName: string;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  isUnsupportedNetwork: boolean;
  targetChainId: number;
  contractAddress: string;
  isConfigured: boolean;
  explorerUrl: string;

  // On-Chain Permissions for Connected Account
  isAuthorizedIssuer: boolean;
  isAdmin: boolean;
  isCheckingRoles: boolean;

  // Transaction Management
  currentTx: TransactionInfo | null;
  clearCurrentTx: () => void;

  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetId?: number) => Promise<void>;

  // Contract Read Methods
  readCertificate: (certId: string) => Promise<OnChainCertificateRecord | null>;
  verifyCertificateOnChain: (
    certId: string,
    candidateHash: string
  ) => Promise<{ isValid: boolean; isRevoked: boolean; issuer: string; issuedAt: number } | null>;

  // Contract Write Methods
  issueCertificateOnChain: (
    certId: string,
    documentHash: string
  ) => Promise<{ txHash: string; blockNumber: number }>;
  revokeCertificateOnChain: (
    certId: string,
    reasonCode: number,
    reasonRef: string
  ) => Promise<{ txHash: string; blockNumber: number }>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Extend Window interface for Ethereum provider
declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const targetChainId = Number(import.meta.env.VITE_CHAIN_ID || 11155111); // Default to Sepolia (11155111)

  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthorizedIssuer, setIsAuthorizedIssuer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false);
  const [currentTx, setCurrentTx] = useState<TransactionInfo | null>(null);

  const contractAddress = getContractAddress(chainId || targetChainId);
  const isConfigured = isContractConfigured(chainId || targetChainId);

  const activeNetworkConfig = chainId ? SUPPORTED_NETWORKS[chainId] : SUPPORTED_NETWORKS[targetChainId];
  const networkName = activeNetworkConfig?.name || (chainId ? `Chain ID ${chainId}` : 'Disconnected');
  const explorerUrl = activeNetworkConfig?.explorerUrl || 'https://sepolia.etherscan.io';
  const isUnsupportedNetwork = Boolean(chainId && chainId !== targetChainId);

  // ===========================================================================
  // PROVIDER HELPERS
  // ===========================================================================

  const getReadOnlyProvider = useCallback((): ethers.Provider => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    const rpcUrl = activeNetworkConfig?.rpcUrl || 'https://rpc.sepolia.org';
    return new ethers.JsonRpcProvider(rpcUrl);
  }, [activeNetworkConfig]);

  const getContractWithSigner = useCallback(async (): Promise<ethers.Contract> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask or Web3 browser wallet is not installed.');
    }
    if (!isConfigured || !contractAddress) {
      throw new Error(
        'Smart contract address is not configured. Please set VITE_CERTICHAIN_CONTRACT_ADDRESS in .env.'
      );
    }
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    return new ethers.Contract(contractAddress, ACADEMIC_CERTIFICATE_REGISTRY_ABI, signer);
  }, [contractAddress, isConfigured]);

  const getReadOnlyContract = useCallback((): ethers.Contract | null => {
    if (!isConfigured || !contractAddress) return null;
    const provider = getReadOnlyProvider();
    return new ethers.Contract(contractAddress, ACADEMIC_CERTIFICATE_REGISTRY_ABI, provider);
  }, [contractAddress, isConfigured, getReadOnlyProvider]);

  // ===========================================================================
  // ROLE VERIFICATION
  // ===========================================================================

  const checkAccountRoles = useCallback(
    async (acc: string, contractAddr: string, provider: ethers.Provider) => {
      if (!acc || !contractAddr) {
        setIsAuthorizedIssuer(false);
        setIsAdmin(false);
        return;
      }

      setIsCheckingRoles(true);
      try {
        const contract = new ethers.Contract(
          contractAddr,
          ACADEMIC_CERTIFICATE_REGISTRY_ABI,
          provider
        );
        const [issuerStatus, adminStatus] = await Promise.all([
          contract.isAuthorizedIssuer(acc).catch(() => false),
          contract.isAdmin(acc).catch(() => false),
        ]);
        setIsAuthorizedIssuer(Boolean(issuerStatus));
        setIsAdmin(Boolean(adminStatus));
      } catch (err) {
        console.warn('Could not read account roles from contract:', err);
        setIsAuthorizedIssuer(false);
        setIsAdmin(false);
      } finally {
        setIsCheckingRoles(false);
      }
    },
    []
  );

  // Update account balance
  const refreshBalance = useCallback(async (acc: string, provider: ethers.Provider) => {
    try {
      const bal = await provider.getBalance(acc);
      setBalance(Number(ethers.formatEther(bal)).toFixed(4));
    } catch {
      setBalance(null);
    }
  }, []);

  // ===========================================================================
  // WALLET CONNECTION & EVENT LISTENERS
  // ===========================================================================

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert(
        'No Ethereum wallet detected. Please install MetaMask, Coinbase Wallet, or Rabby to interact with the blockchain.'
      );
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      // Explicit user action: Request account access
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in wallet.');
      }

      const activeAccount = ethers.getAddress(accounts[0]);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      setAccount(activeAccount);
      setChainId(currentChainId);

      await refreshBalance(activeAccount, browserProvider);

      if (isConfigured && contractAddress) {
        await checkAccountRoles(activeAccount, contractAddress, browserProvider);
      }
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      const errorObj = err as { code?: number; message?: string };
      if (errorObj.code === 4001) {
        setCurrentTx({
          state: 'rejected',
          actionTitle: 'Wallet Connection Denied',
          errorMessage: 'You rejected the connection request in MetaMask.',
          timestamp: Date.now(),
        });
      } else {
        setCurrentTx({
          state: 'failed',
          actionTitle: 'Wallet Connection Failed',
          errorMessage: errorObj.message || 'Failed to connect to Ethereum wallet.',
          timestamp: Date.now(),
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setIsAuthorizedIssuer(false);
    setIsAdmin(false);
    setCurrentTx(null);
  };

  const switchNetwork = async (requestedChainId?: number) => {
    const target = requestedChainId || targetChainId;
    if (typeof window === 'undefined' || !window.ethereum) return;

    const hexChainId = '0x' + target.toString(16);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: unknown) {
      const errorObj = switchError as { code?: number };
      // 4902 means the chain has not been added to MetaMask
      if (errorObj.code === 4902) {
        const netConfig = SUPPORTED_NETWORKS[target];
        if (netConfig) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: hexChainId,
                  chainName: netConfig.name,
                  rpcUrls: [netConfig.rpcUrl || 'https://rpc.sepolia.org'],
                  blockExplorerUrls: [netConfig.explorerUrl || 'https://sepolia.etherscan.io'],
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                },
              ],
            });
          } catch (addError) {
            console.error('Failed to add network to wallet:', addError);
          }
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  // Listen to MetaMask account & network events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accList = accounts as string[];
      if (accList && accList.length > 0) {
        const newAcc = ethers.getAddress(accList[0]);
        setAccount(newAcc);
        const provider = new ethers.BrowserProvider(window.ethereum!);
        refreshBalance(newAcc, provider);
        if (contractAddress) {
          checkAccountRoles(newAcc, contractAddress, provider);
        }
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (chainHex: unknown) => {
      const newChainId = parseInt(chainHex as string, 16);
      setChainId(newChainId);
      if (account) {
        const provider = new ethers.BrowserProvider(window.ethereum!);
        refreshBalance(account, provider);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, contractAddress, checkAccountRoles, refreshBalance]);

  // ===========================================================================
  // READ METHODS
  // ===========================================================================

  const readCertificate = async (certId: string): Promise<OnChainCertificateRecord | null> => {
    const contract = getReadOnlyContract();
    if (!contract) return null;

    try {
      const record = await contract.getCertificate(certId);
      return {
        documentHash: record.documentHash,
        issuer: record.issuer,
        issuedAt: Number(record.issuedAt),
        isRevoked: record.isRevoked,
        revokedAt: Number(record.revokedAt),
        reasonCode: Number(record.reasonCode),
        reasonRef: record.reasonRef,
      };
    } catch {
      return null;
    }
  };

  const verifyCertificateOnChain = async (
    certId: string,
    candidateHash: string
  ): Promise<{ isValid: boolean; isRevoked: boolean; issuer: string; issuedAt: number } | null> => {
    const contract = getReadOnlyContract();
    if (!contract) return null;

    try {
      const res = await contract.verifyCertificate(certId, candidateHash);
      return {
        isValid: res.isValid,
        isRevoked: res.isRevoked,
        issuer: res.issuer,
        issuedAt: Number(res.issuedAt),
      };
    } catch {
      return null;
    }
  };

  // ===========================================================================
  // WRITE METHODS WITH CONFIRMATION & VERIFICATION
  // ===========================================================================

  const issueCertificateOnChain = async (
    certId: string,
    documentHash: string
  ): Promise<{ txHash: string; blockNumber: number }> => {
    if (!account) {
      throw new Error('Please connect your Web3 wallet first.');
    }
    if (isUnsupportedNetwork) {
      throw new Error(`Please switch your wallet to ${activeNetworkConfig?.name || 'the supported network'}.`);
    }
    if (!isConfigured) {
      throw new Error('Smart contract is not configured with a valid address in .env.');
    }

    const contract = await getContractWithSigner();

    // Verify authorized issuer status on-chain prior to sending transaction
    const hasIssuerRole = await contract.isAuthorizedIssuer(account);
    if (!hasIssuerRole) {
      const err = new Error(
        `Account ${account.slice(0, 8)}... is not registered as an authorized certificate issuer on this smart contract.`
      );
      setCurrentTx({
        state: 'failed',
        actionTitle: 'Unauthorized Issuer',
        errorMessage: err.message,
        timestamp: Date.now(),
      });
      throw err;
    }

    try {
      setCurrentTx({
        state: 'pending',
        actionTitle: `Issuing Credential ${certId}`,
        details: 'Waiting for transaction signature and block confirmation...',
        timestamp: Date.now(),
      });

      // Submit transaction
      const tx: ethers.ContractTransactionResponse = await contract.issueCertificate(
        certId,
        documentHash
      );

      setCurrentTx({
        state: 'pending',
        actionTitle: `Issuing Credential ${certId}`,
        txHash: tx.hash,
        details: 'Transaction broadcast! Waiting for 1 block confirmation...',
        timestamp: Date.now(),
      });

      // Wait for mining confirmation
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction was reverted on-chain during execution.');
      }

      // CRITICAL: Verify updated contract state on-chain before claiming success
      const verifiedRecord = await contract.getCertificate(certId);
      if (!verifiedRecord || verifiedRecord.issuedAt === 0n) {
        throw new Error('On-chain state verification failed: Certificate record not found after confirmation.');
      }

      setCurrentTx({
        state: 'confirmed',
        actionTitle: `Credential ${certId} Anchored!`,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        details: `Confirmed on-chain in Block #${receipt.blockNumber}. Gas used: ${receipt.gasUsed.toString()}.`,
        timestamp: Date.now(),
      });

      return { txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (err: unknown) {
      console.error('Error during certificate issuance:', err);
      const errorObj = err as { code?: number; message?: string; info?: { error?: { message?: string } } };

      if (errorObj.code === 4001) {
        setCurrentTx({
          state: 'rejected',
          actionTitle: 'Issuance Transaction Rejected',
          errorMessage: 'You cancelled the transaction signature in your wallet.',
          timestamp: Date.now(),
        });
      } else {
        const revertReason = errorObj.info?.error?.message || errorObj.message || 'Transaction reverted.';
        setCurrentTx({
          state: 'failed',
          actionTitle: 'Issuance Failed',
          errorMessage: revertReason,
          timestamp: Date.now(),
        });
      }
      throw err;
    }
  };

  const revokeCertificateOnChain = async (
    certId: string,
    reasonCode: number,
    reasonRef: string
  ): Promise<{ txHash: string; blockNumber: number }> => {
    if (!account) {
      throw new Error('Please connect your Web3 wallet first.');
    }
    if (isUnsupportedNetwork) {
      throw new Error(`Please switch your wallet to ${activeNetworkConfig?.name || 'the supported network'}.`);
    }
    if (!isConfigured) {
      throw new Error('Smart contract is not configured with a valid address in .env.');
    }

    const contract = await getContractWithSigner();

    // Verify admin role on-chain prior to transaction
    const hasAdminRole = await contract.isAdmin(account);
    if (!hasAdminRole) {
      const err = new Error(
        `Account ${account.slice(0, 8)}... does not have Administrator privileges on this smart contract.`
      );
      setCurrentTx({
        state: 'failed',
        actionTitle: 'Unauthorized Administrator',
        errorMessage: err.message,
        timestamp: Date.now(),
      });
      throw err;
    }

    try {
      setCurrentTx({
        state: 'pending',
        actionTitle: `Revoking Credential ${certId}`,
        details: 'Waiting for transaction signature and block confirmation...',
        timestamp: Date.now(),
      });

      const tx: ethers.ContractTransactionResponse = await contract.revokeCertificate(
        certId,
        reasonCode,
        reasonRef
      );

      setCurrentTx({
        state: 'pending',
        actionTitle: `Revoking Credential ${certId}`,
        txHash: tx.hash,
        details: 'Transaction broadcast! Waiting for 1 block confirmation...',
        timestamp: Date.now(),
      });

      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error('Revocation transaction reverted on-chain.');
      }

      // Verify on-chain revocation state
      const verifiedRecord = await contract.getCertificate(certId);
      if (!verifiedRecord.isRevoked) {
        throw new Error('On-chain state verification failed: Certificate is not marked revoked.');
      }

      setCurrentTx({
        state: 'confirmed',
        actionTitle: `Certificate ${certId} Permanently Revoked`,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        details: `Revocation confirmed in Block #${receipt.blockNumber}. State is now permanently revoked.`,
        timestamp: Date.now(),
      });

      return { txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (err: unknown) {
      console.error('Error during certificate revocation:', err);
      const errorObj = err as { code?: number; message?: string; info?: { error?: { message?: string } } };

      if (errorObj.code === 4001) {
        setCurrentTx({
          state: 'rejected',
          actionTitle: 'Revocation Transaction Rejected',
          errorMessage: 'You cancelled the transaction signature in your wallet.',
          timestamp: Date.now(),
        });
      } else {
        const revertReason = errorObj.info?.error?.message || errorObj.message || 'Revocation transaction reverted.';
        setCurrentTx({
          state: 'failed',
          actionTitle: 'Revocation Failed',
          errorMessage: revertReason,
          timestamp: Date.now(),
        });
      }
      throw err;
    }
  };

  const clearCurrentTx = () => {
    setCurrentTx(null);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        networkName,
        balance,
        isConnecting,
        isConnected: Boolean(account),
        isUnsupportedNetwork,
        targetChainId,
        contractAddress,
        isConfigured,
        explorerUrl,
        isAuthorizedIssuer,
        isAdmin,
        isCheckingRoles,
        currentTx,
        clearCurrentTx,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        readCertificate,
        verifyCertificateOnChain,
        issueCertificateOnChain,
        revokeCertificateOnChain,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
