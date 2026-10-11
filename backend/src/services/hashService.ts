import crypto from 'crypto';

/**
 * Computes exact canonical SHA-256 hash over arbitrary byte buffers or strings.
 */
export function computeSha256(data: Buffer | Uint8Array | string): string {
  const hash = crypto.createHash('sha256');
  if (typeof data === 'string') {
    hash.update(data, 'utf8');
  } else {
    hash.update(data);
  }
  return '0x' + hash.digest('hex');
}

/**
 * Compares two hex hashes in constant time to prevent timing attacks.
 */
export function compareHashes(hashA: string, hashB: string): boolean {
  const cleanA = hashA.toLowerCase().replace(/^0x/, '');
  const cleanB = hashB.toLowerCase().replace(/^0x/, '');
  if (cleanA.length !== cleanB.length) return false;
  return crypto.timingSafeEqual(Buffer.from(cleanA, 'hex'), Buffer.from(cleanB, 'hex'));
}
