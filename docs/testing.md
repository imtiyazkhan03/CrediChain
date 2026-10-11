# CertiChain — Comprehensive Testing Guide

## 1. Testing Philosophy & Invariants

CertiChain is tested against three critical security guarantees:
1. **Cryptographic Integrity**: A certificate is valid if and only if the exact bytes of the PDF generate a SHA-256 hash that matches the immutable `bytes32 documentHash` anchored on-chain.
2. **Revocation Absolute Precedence**: A matching document hash **never overrides a revoked status**. Even if an altered or unaltered PDF matches the registered hash, the verification engine marks the certificate as `revoked`.
3. **Graceful Fault Tolerance**: RPC timeouts or connection disruptions produce an `unavailable` state—never a false positive (`verified`) or false negative (`altered`/`unknown`).

---

## 2. Test Execution Commands

```bash
# Run ALL 95 tests sequentially
npm run test

# Run Smart Contract unit tests only (46 tests)
npm run test:contracts

# Run End-to-End Issuance & Verification tests only (26 tests)
npm run test:e2e

# Run Backend API & Security tests only (23 tests)
npm run test:backend
```

---

## 3. Test Suites Detailed Breakdown

### 3.1. Smart Contract Unit Tests (`test/runTests.js`)
- **Framework**: Node.js + Ganache in-memory EVM (`ethers.js` v6)
- **Total Tests**: 46 Tests (100% Pass)
- **Key Test Scenarios**:
  - Valid registration of certificate ID and SHA-256 document hash by authorized issuer.
  - Rejection of duplicate certificate IDs (`CertificateAlreadyExists`).
  - Rejection of issuance by unauthorized non-issuer addresses (`IssuerNotAuthorized`).
  - Rejection of deauthorized issuers attempting issuance.
  - Rejection of empty certificate IDs and zero-byte hashes (`InvalidCertificateId`, `InvalidDocumentHash`).
  - Irreversible certificate revocation by authorized administrators with audit reason codes.
  - Repeated revocation prevention (`CertificateAlreadyRevoked`).
  - Unauthorized admin operations rejection (`UnauthorizedAdmin`).
  - Multi-admin governance and prevention of removing the final administrator (`CannotRemoveLastAdmin`).

### 3.2. End-to-End Cryptography Suite (`test/endToEndVerification.test.js`)
- **Total Tests**: 26 Tests (100% Pass)
- **Key Test Scenarios**:
  - Complete PDF generation using `pdf-lib` with vector typography, gold seals, and dynamic QR code.
  - SHA-256 byte digest computation over exact PDF binary bytes.
  - Original authentic PDF produces `verified` outcome.
  - Tampered PDF (1 modified byte) produces `altered` outcome with clear mismatch explanation.
  - Query for non-existent certificate ID produces `unknown` outcome.
  - Verification of revoked certificate with exact matching PDF produces `revoked` outcome (verifying the revocation precedence invariant).
  - Verification without document bytes notes that on-chain record exists while awaiting file upload.
  - Network provider failure simulation produces `unavailable` outcome without claiming invalid or verified.

### 3.3. Backend REST API & Security Audit Suite (`test/backendApi.test.ts`)
- **Total Tests**: 23 Tests (100% Pass)
- **Key Test Scenarios**:
  - System health check `/api/health` returns HTTP 200 with environment configuration.
  - Bcrypt password authentication and JWT signing across all 4 roles.
  - HTTP 401 Unauthorized for incorrect passwords and malformed requests.
  - Role-Based Access Control (RBAC):
    - Admin can list all certificates.
    - Student can list *only* their own certificates.
    - Public/verifier accounts receive HTTP 403 Forbidden when attempting to list the directory.
    - Student attempting to issue or revoke a certificate receives HTTP 403 Forbidden.
  - Zero-PII public verification: strips student email, student ID, GPA, and file paths.
  - Safe file uploads: rejects non-PDF files and files lacking `%PDF-` magic bytes with HTTP 400.
  - Rejects uploaded PDFs whose actual SHA-256 hash does not match the registered record.
