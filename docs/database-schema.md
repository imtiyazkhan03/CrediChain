# CertiChain — Database & Storage Schema Documentation

## 1. Storage Strategy Overview

CertiChain implements a dual-layer storage pattern:
1. **On-Chain (Blockchain)**: Immutable cryptographic trust anchors (`bytes32 documentHash`, issuer address, timestamps, revocation flags). Strictly **zero personally identifiable information (PII)** is recorded on-chain.
2. **Off-Chain (Database & Private Vault)**: Complete academic records, student details, course conferral data, and physical PDF binaries stored securely in private institutional vaults.

---

## 2. Entity Schemas

### 2.1. User Entity Schema (`users`)

```typescript
interface UserEntity {
  id: string;              // Primary key (e.g., 'usr-admin-1')
  name: string;            // Full legal name of user/official
  email: string;           // Institutional email (Unique, indexed)
  passwordHash: string;    // Bcrypt salted hash (cost factor: 10)
  role: 'admin' | 'student' | 'authority' | 'verifier';
  title: string;           // Official designation (e.g., 'University Registrar')
  institution: string;     // Affiliated entity (e.g., 'Stanford University')
  studentId?: string;      // Institutional UID (if student)
  avatar?: string;         // Profile avatar URL
  createdAt: string;       // ISO 8601 timestamp
}
```

### 2.2. Certificate Entity Schema (`certificates`)

```typescript
interface CertificateRecord {
  id: string;              // Unique Certificate ID (e.g., 'CERT-2024-8841', indexed)
  txHash: string;          // Truncated transaction hash for UI display
  fullTxHash: string;      // Full 66-character EVM transaction hash
  certHash: string;        // 64-character SHA-256 hex digest of exact PDF bytes
  studentName: string;     // Full name of graduate
  studentId: string;       // Institutional student identification number
  studentEmail: string;    // Student institutional email
  studentAvatar?: string;  // Student portrait URL
  degree: string;          // Degree conferral title (e.g., 'M.S. in Computer Science')
  department: string;      // Department/Faculty (e.g., 'School of Engineering')
  honors?: string;         // Academic distinction (e.g., 'Summa Cum Laude')
  date: string;            // Conferral date (e.g., 'Mar 14, 2024')
  mintedDate: string;      // Block confirmation UTC timestamp
  blockNumber: number;     // EVM block height
  status: 'Verified' | 'Revoked' | 'Pending';
  revocationReason?: string;// Non-sensitive justification for revocation
  revokedAt?: string;      // UTC timestamp of revocation
  issuer: string;          // Primary issuing registrar name
  issuerRole: string;      // Primary issuing title
  coSigner?: string;       // Academic Dean / Co-signatory
  coSignerRole?: string;   // Academic Dean title
  gpa?: string;            // Cumulative Grade Point Average
  pdfPath?: string;        // Path to encrypted physical PDF in private storage
  createdAt: string;       // ISO 8601 creation timestamp
  updatedAt: string;       // ISO 8601 update timestamp
}
```

---

## 3. Public Verification Projection (Zero-PII Privacy Masking)

When public recruiters query `GET /api/verify/:certificateId`, the backend executes strict data sanitization, stripping student contact details, institutional IDs, GPAs, and internal disk locations:

| Field | Private Record (Admin / Owner) | Public Verification Projection | Privacy Rationale |
| :--- | :---: | :---: | :--- |
| `id` | ✅ Exposed | ✅ Exposed | Needed to verify registration identity |
| `degree` | ✅ Exposed | ✅ Exposed | Core qualification being verified |
| `department` | ✅ Exposed | ✅ Exposed | Faculty validation |
| `honors` | ✅ Exposed | ✅ Exposed | Conferred academic achievement |
| `date` | ✅ Exposed | ✅ Exposed | Graduation date verification |
| `status` | ✅ Exposed | ✅ Exposed | Validity state (`Verified` / `Revoked`) |
| `certHash` | ✅ Exposed | ✅ Exposed | Cryptographic byte comparison |
| `txHash` | ✅ Exposed | ✅ Exposed | On-chain audit trail link |
| `studentName` | Full Legal Name | Masked / Conferred Name | Degree holder verification |
| `studentEmail` | ✅ Exposed | ❌ **STRIPPED** | Anti-phishing, privacy compliance |
| `studentId` | ✅ Exposed | ❌ **STRIPPED** | Prevents identity theft & harvesting |
| `gpa` | ✅ Exposed | ❌ **STRIPPED** | Academic privacy (FERPA compliance) |
| `pdfPath` | ✅ Exposed | ❌ **STRIPPED** | Prevents unauthorized file access |

---

## 4. Physical Document Vault (`storage/certificates/`)

- Certificate PDF documents are archived in a dedicated storage directory isolated from public web access.
- Filenames use collision-resistant UUIDs (e.g. `9f8e7d6c-5b4a-3210-fedc-ba9876543210.pdf`).
- Downloads are mediated through the authenticated `GET /api/certificates/:id/document` endpoint, which verifies that the requesting JWT belongs to the student who owns the degree or an authorized university administrator.
