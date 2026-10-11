export interface CertificateMetadata {
  id: string;
  studentName: string;
  studentId: string;
  degree: string;
  department: string;
  honors?: string;
  issueDate: string;
  documentHash: string;
  txHash?: string;
  blockNumber?: number;
  issuer: string;
  issuerRole: string;
  coSigner: string;
  coSignerRole: string;
  status: 'Verified' | 'Revoked' | 'Pending';
  revocationReason?: string;
  revokedAt?: string;
}

// In-memory fallback map (shared in Node.js test runs and fast memory access)
const memoryDocStore = new Map<string, Uint8Array>();
const memoryMetaStore = new Map<string, CertificateMetadata>();

const STORAGE_PREFIX_DOC = 'certichain_doc_';
const STORAGE_PREFIX_META = 'certichain_meta_';

/**
 * Stores the final certificate PDF bytes privately.
 */
export async function storeCertificateDocument(
  certId: string,
  pdfBytes: Uint8Array
): Promise<void> {
  memoryDocStore.set(certId, pdfBytes);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Store in localStorage as base64 chunk
      const binaryString = Array.from(pdfBytes)
        .map((b) => String.fromCharCode(b))
        .join('');
      const base64 = btoa(binaryString);
      localStorage.setItem(`${STORAGE_PREFIX_DOC}${certId}`, base64);
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable; stored in memory store.', e);
    }
  }
}

/**
 * Retrieves the stored private certificate PDF bytes.
 * Returns null if the document file is missing or unavailable.
 */
export async function retrieveCertificateDocument(
  certId: string
): Promise<Uint8Array | null> {
  // Check memory store first
  if (memoryDocStore.has(certId)) {
    return memoryDocStore.get(certId)!;
  }

  // Check localStorage in browser
  if (typeof window !== 'undefined' && window.localStorage) {
    const base64 = localStorage.getItem(`${STORAGE_PREFIX_DOC}${certId}`);
    if (base64) {
      try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        memoryDocStore.set(certId, bytes);
        return bytes;
      } catch (err) {
        console.error('Failed to decode document from local storage:', err);
      }
    }
  }

  return null;
}

/**
 * Stores non-sensitive off-chain metadata.
 */
export async function saveCertificateMetadata(
  certId: string,
  metadata: CertificateMetadata
): Promise<void> {
  memoryMetaStore.set(certId, metadata);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX_META}${certId}`,
        JSON.stringify(metadata)
      );
    } catch (e) {
      console.warn('Failed to persist metadata in localStorage:', e);
    }
  }
}

/**
 * Retrieves off-chain metadata for a certificate.
 */
export async function getCertificateMetadata(
  certId: string
): Promise<CertificateMetadata | null> {
  if (memoryMetaStore.has(certId)) {
    return memoryMetaStore.get(certId)!;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX_META}${certId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        memoryMetaStore.set(certId, parsed);
        return parsed;
      } catch (e) {
        console.error('Failed to parse metadata from localStorage:', e);
      }
    }
  }

  return null;
}

/**
 * Clears private document storage for test isolation.
 */
export function clearStorage(): void {
  memoryDocStore.clear();
  memoryMetaStore.clear();
}
