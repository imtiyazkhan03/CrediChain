import { ethers } from 'ethers';

/**
 * Computes a standard cryptographic SHA-256 hash over exact binary bytes.
 * @param bytes Exact binary bytes of the file (Uint8Array or ArrayBuffer)
 * @returns 0x-prefixed 64-character hex string (32 bytes)
 */
export function computeSha256(bytes: Uint8Array | ArrayBuffer): string {
  const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return ethers.sha256(uint8);
}

/**
 * Validates whether a candidate hash is a valid 32-byte 0x-prefixed hex string.
 */
export function isValidSha256(hash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(hash);
}
