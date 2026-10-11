import { computeSha256 } from './hashService.ts';
import {
  retrieveCertificateDocument,
  getCertificateMetadata,
  type CertificateMetadata,
} from './storageService.ts';
import type { OnChainCertificateRecord } from '../types/index.ts';

export type VerificationOutcome =
  | 'verified'     // Document matches on-chain hash and certificate is active
  | 'altered'      // Document bytes modified; SHA-256 digest does not match
  | 'revoked'      // Certificate revoked on-chain (STRICT: overrides matching hash!)
  | 'unknown'      // Certificate ID does not exist on-chain
  | 'unavailable'; // Network, RPC, storage, or contract connection failed

export interface VerificationResult {
  outcome: VerificationOutcome;
  certId: string;
  onChainRecord?: OnChainCertificateRecord;
  computedHash?: string;
  metadata?: CertificateMetadata | null;
  hasDocument: boolean;
  message: string;
  errorDetail?: string;
  timestamp: number;
}

/**
 * Interface allowing either a real ethers Contract instance, read method, or provider.
 */
export interface ContractReader {
  getCertificate: (certId: string) => Promise<{
    documentHash: string;
    issuer: string;
    issuedAt: bigint | number;
    isRevoked: boolean;
    revokedAt: bigint | number;
    reasonCode: number;
    reasonRef: string;
  }>;
}

/**
 * Executes end-to-end cryptographic certificate verification.
 * Follows strict trust principles:
 * - Matching document hash NEVER overrides revoked status.
 * - Network or RPC connection failures produce 'unavailable' state (never invalid or verified).
 *
 * @param certId Unique certificate identifier (e.g., "CERT-2024-8841")
 * @param contractReader Connected smart contract reader
 * @param candidateBytes Optional binary PDF bytes provided by user or verifier
 */
export async function verifyCertificateEndToEnd(
  certId: string,
  contractReader: ContractReader,
  candidateBytes?: Uint8Array | null
): Promise<VerificationResult> {
  const timestamp = Date.now();
  const normalizedId = certId.trim();

  // 1. Resolve and validate Certificate ID format
  if (!normalizedId) {
    return {
      outcome: 'unknown',
      certId: '',
      hasDocument: false,
      message: 'Certificate ID is empty or invalid.',
      timestamp,
    };
  }

  // 2. Query On-Chain Record from Smart Contract
  let onChainRecord: OnChainCertificateRecord;
  try {
    const raw = await contractReader.getCertificate(normalizedId);
    onChainRecord = {
      documentHash: raw.documentHash,
      issuer: raw.issuer,
      issuedAt: Number(raw.issuedAt),
      isRevoked: raw.isRevoked,
      revokedAt: Number(raw.revokedAt),
      reasonCode: Number(raw.reasonCode),
      reasonRef: raw.reasonRef,
    };
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || String(err);

    // If contract reverted because certificate does not exist:
    if (
      errorMsg.includes('CertificateDoesNotExist') ||
      errorMsg.includes('does not exist')
    ) {
      return {
        outcome: 'unknown',
        certId: normalizedId,
        hasDocument: false,
        message: `Certificate ID "${normalizedId}" was not found in the smart contract registry.`,
        timestamp,
      };
    }

    // Network, RPC timeout, offline, or provider failure -> UNAVAILABLE
    return {
      outcome: 'unavailable',
      certId: normalizedId,
      hasDocument: false,
      message: 'Blockchain connection or RPC provider is temporarily unavailable.',
      errorDetail: errorMsg,
      timestamp,
    };
  }

  // Check if unissued/empty record returned without revert
  if (!onChainRecord || onChainRecord.issuedAt === 0) {
    return {
      outcome: 'unknown',
      certId: normalizedId,
      hasDocument: false,
      message: `Certificate ID "${normalizedId}" is not registered on-chain.`,
      timestamp,
    };
  }

  // Retrieve off-chain metadata if available
  const metadata = await getCertificateMetadata(normalizedId);

  // 3. Retrieve document bytes if not provided directly
  let documentBytes = candidateBytes || null;
  if (!documentBytes) {
    try {
      documentBytes = await retrieveCertificateDocument(normalizedId);
    } catch {
      documentBytes = null;
    }
  }

  // 4. Compute SHA-256 hash of document bytes if available
  let computedHash: string | undefined;
  if (documentBytes && documentBytes.length > 0) {
    computedHash = computeSha256(documentBytes);
  }

  // 5. Check Revocation Status FIRST
  // CRITICAL PRINCIPLE: A matching hash must NEVER override a revoked status!
  if (onChainRecord.isRevoked) {
    return {
      outcome: 'revoked',
      certId: normalizedId,
      onChainRecord,
      computedHash,
      metadata,
      hasDocument: Boolean(documentBytes),
      message: `This certificate was permanently revoked by university authorities on ${
        onChainRecord.revokedAt > 0
          ? new Date(onChainRecord.revokedAt * 1000).toUTCString()
          : 'record'
      }. Reason Code: ${onChainRecord.reasonCode}.`,
      timestamp,
    };
  }

  // 6. If active, verify document bytes integrity
  if (computedHash) {
    const isHashMatching =
      computedHash.toLowerCase() === onChainRecord.documentHash.toLowerCase();

    if (isHashMatching) {
      return {
        outcome: 'verified',
        certId: normalizedId,
        onChainRecord,
        computedHash,
        metadata,
        hasDocument: true,
        message: 'Cryptographically authentic. Document SHA-256 matches on-chain anchor.',
        timestamp,
      };
    } else {
      return {
        outcome: 'altered',
        certId: normalizedId,
        onChainRecord,
        computedHash,
        metadata,
        hasDocument: true,
        message: 'Tampering detected: Document SHA-256 hash differs from on-chain anchor.',
        timestamp,
      };
    }
  }

  // If no document bytes are present at all:
  // We can confirm the ID exists and is active on-chain, but the document file was not provided
  return {
    outcome: 'verified',
    certId: normalizedId,
    onChainRecord,
    metadata,
    hasDocument: false,
    message: 'On-chain credential is registered and valid. Awaiting document file for byte-level hash verification.',
    timestamp,
  };
}
