export type CertificateStatus = 'Verified' | 'Pending' | 'Revoked';

export type UserRole = 'admin' | 'university_admin' | 'student' | 'authority' | 'verifier' | 'validator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  institution?: string;
  studentId?: string;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  studentUid: string;
  email: string;
  avatar?: string;
  faculty: string;
  program: string;
  gradYear: string;
  status: 'Graduated' | 'Active' | 'Candidate';
  totalCertificates: number;
  walletAddress: string;
}

export interface Certificate {
  id: string; // e.g. "CERT-2024-8841"
  txHash: string; // e.g. "0x4b7f...989c"
  fullTxHash?: string;
  certHash: string; // SHA-256 payload digest
  studentName: string;
  studentId: string; // e.g. "SU-2020-0492"
  studentEmail?: string;
  studentAvatar?: string;
  studentInitials?: string;
  degree: string;
  department: string;
  honors?: string;
  date: string;
  mintedDate: string;
  blockNumber: number;
  status: CertificateStatus;
  merkleRoot: string;
  ipfsCid: string;
  issuer: string;
  issuerRole: string;
  coSigner: string;
  coSignerRole: string;
  gpa?: string;
  revocationReason?: string;
  revokedAt?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'batch_mint' | 'verification' | 'merkle_anchor' | 'qr_scan' | 'revocation';
  title: string;
  description: string;
  timeAgo: string;
  txHash?: string;
  blockNumber?: number;
  gasCost?: string;
  subText?: string;
  status?: string;
  icon: string;
  iconColor: string;
}

export interface Signer {
  id: string;
  name: string;
  role: string;
  status: 'Signed' | 'Awaiting Sig' | 'Rejected';
  timestamp?: string;
  avatar?: string;
  initials?: string;
}

export interface VerificationLog {
  id: string;
  certId: string;
  studentName: string;
  verifier: string;
  method: 'ZK-SNARK Proof' | 'Public QR Scan' | 'Direct RPC Call' | 'API Registry';
  result: 'Valid' | 'Tampered' | 'Revoked';
  latency: string;
  timestamp: string;
  location: string;
}

export type TransactionState = 'idle' | 'pending' | 'confirmed' | 'rejected' | 'failed';

export interface TransactionInfo {
  state: TransactionState;
  txHash?: string;
  blockNumber?: number;
  errorMessage?: string;
  actionTitle?: string;
  details?: string;
  timestamp?: number;
}

export interface OnChainCertificateRecord {
  documentHash: string;
  issuer: string;
  issuedAt: number;
  isRevoked: boolean;
  revokedAt: number;
  reasonCode: number;
  reasonRef: string;
}
