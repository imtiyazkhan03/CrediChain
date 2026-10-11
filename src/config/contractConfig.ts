/**
 * CertiChain — Smart Contract Configuration & ABI Strategy
 *
 * This configuration module provides typed access to the compiled ABI,
 * addresses per network, and a clear contract initialization factory.
 *
 * Note: Per project policy, live testnet deployment is never claimed until verified.
 * The default address is loaded from `VITE_CERTICHAIN_CONTRACT_ADDRESS` or left empty.
 */

import registryArtifact from '../../contracts/AcademicCertificateRegistry.json';

export const ACADEMIC_CERTIFICATE_REGISTRY_ABI = registryArtifact.abi;
export const CONTRACT_BYTECODE = registryArtifact.bytecode;
export const COMPILER_VERSION = registryArtifact.compilerVersion;

export interface NetworkConfig {
  chainId: number;
  name: string;
  contractAddress: string;
  rpcUrl?: string;
  explorerUrl?: string;
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  11155111: {
    chainId: 11155111,
    name: 'Ethereum Sepolia Testnet',
    contractAddress: import.meta.env.VITE_CERTICHAIN_CONTRACT_ADDRESS || '',
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    contractAddress: import.meta.env.VITE_AMOY_CONTRACT_ADDRESS || '',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
  },
  31337: {
    chainId: 31337,
    name: 'Local EVM Dev Node',
    contractAddress: import.meta.env.VITE_LOCAL_CONTRACT_ADDRESS || '',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
  },
};

/**
 * Returns active contract address for the specified chainId or environment variable.
 */
export function getContractAddress(chainId?: number): string {
  if (chainId && SUPPORTED_NETWORKS[chainId]?.contractAddress) {
    return SUPPORTED_NETWORKS[chainId].contractAddress;
  }
  return import.meta.env.VITE_CERTICHAIN_CONTRACT_ADDRESS || '';
}

/**
 * Check if a live deployed contract address is configured.
 */
export function isContractConfigured(chainId?: number): boolean {
  const address = getContractAddress(chainId);
  return Boolean(
    address &&
      address.startsWith('0x') &&
      address.length === 42 &&
      address !== '0x0000000000000000000000000000000000000000'
  );
}
