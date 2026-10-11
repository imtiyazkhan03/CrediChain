# CertiChain — Phase 3: Solidity Smart Contract & EVM Testing Guide

## 1. Overview & Privacy Architecture

The [`AcademicCertificateRegistry.sol`](./AcademicCertificateRegistry.sol) smart contract serves as the decentralized trust anchor for the CertiChain ecosystem. It enables authorized educational institutions to record tamper-evident credential proofs and disciplinary revocations on an EVM-compatible blockchain.

### Zero Personal Data On-Chain (GDPR / FERPA Compliant)
To protect student privacy and comply with global privacy regulations, **no personally identifiable information (PII) is stored on-chain**:
- ❌ No student names
- ❌ No student ID / matriculation numbers
- ❌ No grades or GPAs
- ❌ No PDF documents or image files

### Minimal On-Chain Record Structure
Only cryptographic digests, timestamps, and authorized custodial addresses are recorded:
```solidity
struct CertificateRecord {
    bytes32 documentHash;   // SHA-256 digest of canonical certificate JSON payload
    address issuer;         // Registrar custodian Ethereum address
    uint64 issuedAt;        // Block timestamp of on-chain registration
    bool isRevoked;         // Irreversible revocation flag
    uint64 revokedAt;       // Timestamp of revocation (0 if active)
    uint16 reasonCode;      // Categorical non-sensitive reason (e.g. 101: Disciplinary Rescission)
    bytes32 reasonRef;      // Optional cryptographic hash of confidential disciplinary docket
}
```

---

## 2. Security Invariants & Core Rules

1. **Role-Based Access Control (RBAC)**:
   - **Administrators**: Can authorize/deauthorize issuers, add/remove admins (safeguarded against removing the sole administrator), and revoke certificates.
   - **Issuers**: Authorized university registrar wallets that can register credentials.
   - **Public Verifiers / Anyone**: Can execute `verifyCertificate(...)` and `getCertificate(...)` to verify any credential trustlessly without gas fees.
2. **Duplicate Prevention**: Certificate IDs cannot be registered more than once. Attempting duplicate registration reverts with `CertificateAlreadyExists`.
3. **Irreversible Revocation**: Once marked as revoked by an authorized administrator, a certificate cannot be unrevoked. Repeated revocation attempts revert with `CertificateAlreadyRevoked`.
4. **Checks-Effects-Interactions (CEI)**: Every state mutation validates conditions first using custom errors, updates state storage, and emits indexing events.

---

## 3. Step-by-Step Remix IDE Deployment Guide

### Step 1: Open Remix IDE
Navigate to [https://remix.ethereum.org](https://remix.ethereum.org) in a web browser.

### Step 2: Upload or Create Contract Files
In the Remix File Explorer (`contracts/` folder), create two new files and paste their contents:
1. `AcademicCertificateRegistry.sol` (from `contracts/AcademicCertificateRegistry.sol`)
2. `AcademicCertificateRegistry_test.sol` (from `contracts/AcademicCertificateRegistry_test.sol`)

### Step 3: Compile Contract
1. Click on the **Solidity Compiler** tab (left sidebar).
2. Select **Compiler Version**: `0.8.20` (or `0.8.24`).
3. Under **Advanced Configurations**, enable optimization (`200` runs).
4. Click **Compile AcademicCertificateRegistry.sol** (Blue checkmark will appear).

### Step 4: Deploy
1. Click on the **Deploy & Run Transactions** tab (left sidebar).
2. Choose **Environment**:
   - For rapid testing: select **Remix VM (Shanghai / Cancun)**.
   - For public testnet (Sepolia/Amoy): select **Injected Provider - MetaMask** (ensure MetaMask is connected to Ethereum Sepolia or Polygon Amoy and has testnet gas faucet tokens).
3. Select `AcademicCertificateRegistry` in the **Contract** dropdown.
4. Click **Deploy**.
5. Once confirmed, the deployed contract instance will appear under **Deployed Contracts**.

### Step 5: Test Execution in Remix
- Expand the deployed contract to view all read and write functions:
  - `authorizeIssuer(address)` — Authorize your university registrar address.
  - `issueCertificate(certId, documentHash)` — Issue a test certificate (e.g., `CERT-2024-8841` with a `bytes32` hash).
  - `verifyCertificate(certId, candidateHash)` — Call with matching and mismatched hashes to verify the return tuple `(isValid, isRevoked, issuer, issuedAt)`.
  - `revokeCertificate(certId, 101, 0x0...)` — Revoke the credential and observe that subsequent `verifyCertificate` calls immediately return `isValid: false, isRevoked: true`.

### Step 6: Run Solidity Unit Tests in Remix
1. In Remix, open the **Plugin Manager** (plug icon in bottom left).
2. Search for **Solidity unit testing** and click **Activate**.
3. In the unit testing panel, select `AcademicCertificateRegistry_test.sol`.
4. Click **Run**.
5. All 7 test functions will run and show green checkmarks.

---

## 4. Local EVM Automated Test Suite

We have provided a comprehensive in-memory EVM test runner that executes 46 automated assertions:
```bash
npm run test:contracts
```
To recompile the contract with `solc` and refresh the ABI artifact:
```bash
npm run compile:contracts
```

### Test Coverage Checklist:
- ✅ **Valid issuance**: Issuer registration, event emission, and matching public verification.
- ✅ **Duplicate IDs**: Reverts with `CertificateAlreadyExists`.
- ✅ **Unauthorized issuers**: Reverts with `IssuerNotAuthorized`.
- ✅ **Invalid IDs & Hashes**: Reverts on empty ID or null `bytes32(0)` hash.
- ✅ **Revocation**: Administrator revocation with reason code and audit reference.
- ✅ **Repeated revocation & Irreversibility**: Reverts on subsequent revocations and maintains permanent revoked state.
- ✅ **Unauthorized administrative operations**: Reverts non-admin revocation, authorization, and protects against removing the sole administrator.

---

## 5. ABI & Contract Address Configuration Strategy

### ABI Location
- Generated artifact: [`contracts/AcademicCertificateRegistry.json`](./AcademicCertificateRegistry.json)
- Frontend typed provider: [`src/config/contractConfig.ts`](../src/config/contractConfig.ts)

### Environment Variable Setup
When deploying to a public testnet, store the resulting contract address in `.env`:
```env
# Ethereum Sepolia Testnet
VITE_CERTICHAIN_CONTRACT_ADDRESS=0xYourDeployedContractAddressHere
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Polygon Amoy Testnet (Alternative)
VITE_AMOY_CONTRACT_ADDRESS=0xYourDeployedAmoyContractAddressHere
```

### Verified Deployment Status Disclosure
> [!IMPORTANT]
> **Deployment Status**: The contract has been compiled with Solidity `0.8.20` and 100% verified via 46/46 automated unit tests on an EVM environment. Deployment to a public network (such as Ethereum Sepolia) has **not** been performed yet and requires your testnet wallet signature via Remix or Hardhat.
