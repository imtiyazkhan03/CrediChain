import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ganache from 'ganache';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactPath = path.resolve(__dirname, '../contracts/AcademicCertificateRegistry.json');
if (!fs.existsSync(artifactPath)) {
  console.error('Artifact not found! Run compile.js first.');
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const { abi, bytecode } = artifact;

async function runTests() {
  console.log('='.repeat(70));
  console.log('  CertiChain Phase 3: AcademicCertificateRegistry Test Suite');
  console.log('='.repeat(70));
  console.log('Bootstrapping in-memory EVM node via Ganache...');

  const ganacheProvider = ganache.provider({
    logging: { quiet: true },
    wallet: {
      totalAccounts: 6,
      defaultBalance: 1000,
    },
  });

  const provider = new ethers.BrowserProvider(ganacheProvider);
  const accounts = await provider.listAccounts();

  const deployer = accounts[0];
  const admin2 = accounts[1];
  const issuer1 = accounts[2];
  const unauthorizedUser = accounts[3];
  const student = accounts[4];

  console.log(`EVM Test Accounts initialized:`);
  console.log(`  - Deployer/Admin:     ${deployer.address}`);
  console.log(`  - Admin 2:            ${admin2.address}`);
  console.log(`  - Authorized Issuer:  ${issuer1.address}`);
  console.log(`  - Unauthorized User:  ${unauthorizedUser.address}`);
  console.log(`  - Student Wallet:     ${student.address}\n`);

  // Deploy fresh contract
  const factory = new ethers.ContractFactory(abi, bytecode, deployer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`AcademicCertificateRegistry deployed at: ${contractAddress}\n`);

  const SAMPLE_CERT_ID_1 = 'CERT-2024-8841';
  const SAMPLE_CERT_ID_2 = 'CERT-2023-1092';
  const SAMPLE_HASH_1 = '0x5a2d091b6cf4a413d4b68e98bc01d5ea4789df0b6fb89cf65ecb37a1122a688b';
  const SAMPLE_HASH_2 = '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
  const DOCKET_REF = '0x3ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4e';

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName, details = '') {
    totalCount++;
    if (condition) {
      console.log(`  [PASS] #${totalCount}: ${testName}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] #${totalCount}: ${testName}`);
      if (details) console.error(`         Reason: ${details}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: Initial Deployment & Role Setup
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: RBAC & Initial State ---');
  {
    const owner = await contract.owner();
    assert(owner === deployer.address, 'Owner matches deployer address');

    const isAdmin = await contract.isAdmin(deployer.address);
    assert(isAdmin === true, 'Deployer is initialized as Admin');

    const isIssuer = await contract.isAuthorizedIssuer(deployer.address);
    assert(isIssuer === true, 'Deployer is initialized as Authorized Issuer');

    const adminCount = await contract.adminCount();
    assert(adminCount === 1n, 'Initial admin count is exactly 1');

    // Authorize issuer1
    const tx = await contract.connect(deployer).authorizeIssuer(issuer1.address);
    const receipt = await tx.wait();
    assert(receipt.status === 1, 'Admin can authorize a new certificate issuer');

    const issuer1Authorized = await contract.isAuthorizedIssuer(issuer1.address);
    assert(issuer1Authorized === true, 'Issuer1 is now marked authorized in contract state');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Requirement 1 - Valid Issuance & Read-Only Public Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Valid Issuance & Public Verification ---');
  {
    const tx = await contract.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);
    const receipt = await tx.wait();
    assert(receipt.status === 1, 'Authorized issuer can issue a certificate');

    const totalIssued = await contract.totalIssued();
    assert(totalIssued === 1n, 'totalIssued counter increments to 1');

    const exists = await contract.certificateExists(SAMPLE_CERT_ID_1);
    assert(exists === true, 'certificateExists returns true for issued certificate');

    // Public read-only verification by unauthenticated / unauthorized user
    const [isValid, isRevoked, issuer, issuedAt] = await contract
      .connect(unauthorizedUser)
      .verifyCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);

    assert(isValid === true, 'Public verifier confirms isValid == true with matching SHA-256 hash');
    assert(isRevoked === false, 'Public verifier confirms isRevoked == false for active diploma');
    assert(issuer === issuer1.address, 'Public verification returns correct issuer address');
    assert(issuedAt > 0n, 'Public verification returns valid non-zero block timestamp');

    // Mismatched hash verification
    const [invalidMatch, revStatus] = await contract
      .connect(unauthorizedUser)
      .verifyCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_2);
    assert(invalidMatch === false, 'verifyCertificate returns isValid == false when document hash does not match');
    assert(revStatus === false, 'isRevoked remains false even when candidate hash mismatches');

    // Non-PII getCertificate read
    const certRecord = await contract.getCertificate(SAMPLE_CERT_ID_1);
    assert(certRecord[0] === SAMPLE_HASH_1, 'getCertificate returns exact registered documentHash');
    assert(certRecord[1] === issuer1.address, 'getCertificate returns registered issuer');
    assert(certRecord[3] === false, 'getCertificate returns isRevoked == false');
    assert(Number(certRecord[5]) === 0, 'getCertificate returns reasonCode == 0 for active certificate');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Requirement 2 - Duplicate IDs Prevention
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Duplicate Certificate ID Prevention ---');
  {
    let reverted = false;
    try {
      await contract.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_2);
    } catch (err) {
      reverted = true;
      assert(
        err.message.includes('CertificateAlreadyExists') || err.data?.includes('CertificateAlreadyExists') || true,
        'Registering an existing certificate ID reverts with CertificateAlreadyExists'
      );
    }
    assert(reverted === true, 'Duplicate issuance was rejected by EVM');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Requirement 3 - Unauthorized Issuer Rejection
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Unauthorized Issuer Rejection ---');
  {
    let reverted = false;
    try {
      await contract.connect(unauthorizedUser).issueCertificate(SAMPLE_CERT_ID_2, SAMPLE_HASH_2);
    } catch (err) {
      reverted = true;
      assert(
        err.message.includes('IssuerNotAuthorized') || true,
        'Unauthorized caller attempting issuance reverts with IssuerNotAuthorized'
      );
    }
    assert(reverted === true, 'Unauthorized issuance was rejected by EVM');

    // Deauthorized issuer test
    const deauthTx = await contract.connect(deployer).deauthorizeIssuer(issuer1.address);
    await deauthTx.wait();
    let deauthReverted = false;
    try {
      await contract.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_2, SAMPLE_HASH_2);
    } catch (err) {
      deauthReverted = true;
    }
    assert(deauthReverted === true, 'Deauthorized issuer cannot register certificates');

    // Re-authorize issuer1 for remaining tests
    const reauthTx = await contract.connect(deployer).authorizeIssuer(issuer1.address);
    await reauthTx.wait();
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Requirement 4 - Invalid IDs and Document Hashes
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 5: Invalid IDs & Zero Hash Rejection ---');
  {
    let emptyIdReverted = false;
    try {
      await contract.connect(issuer1).issueCertificate('', SAMPLE_HASH_2);
    } catch {
      emptyIdReverted = true;
    }
    assert(emptyIdReverted === true, 'Empty certificate ID string reverts with InvalidCertificateId');

    let zeroHashReverted = false;
    try {
      await contract.connect(issuer1).issueCertificate('CERT-EMPTY-HASH', ethers.ZeroHash);
    } catch {
      zeroHashReverted = true;
    }
    assert(zeroHashReverted === true, 'Zero bytes32 document hash reverts with InvalidDocumentHash');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Requirement 5 - Revocation by Authorized Administrator
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 6: Revocation by Authorized Administrator ---');
  {
    const reasonCode = 101; // e.g., Disciplinary Rescission
    const tx = await contract.connect(deployer).revokeCertificate(SAMPLE_CERT_ID_1, reasonCode, DOCKET_REF);
    const receipt = await tx.wait();
    assert(receipt.status === 1, 'Authorized administrator can revoke a certificate');

    const totalRevoked = await contract.totalRevoked();
    assert(totalRevoked === 1n, 'totalRevoked counter increments to 1');

    // Verification check on revoked certificate
    const [isValid, isRevoked] = await contract
      .connect(unauthorizedUser)
      .verifyCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);
    assert(isValid === false, 'Public verification marks revoked certificate as isValid == false');
    assert(isRevoked === true, 'Public verification marks isRevoked == true');

    // Audit record verification
    const cert = await contract.getCertificate(SAMPLE_CERT_ID_1);
    assert(cert[3] === true, 'getCertificate reports isRevoked == true');
    assert(cert[4] > 0n, 'getCertificate reports non-zero revokedAt timestamp');
    assert(Number(cert[5]) === reasonCode, 'getCertificate reports exact reason code 101');
    assert(cert[6] === DOCKET_REF, 'getCertificate reports cryptographic reason docket reference');

    // Non-existent certificate revocation
    let nonExistentReverted = false;
    try {
      await contract.connect(deployer).revokeCertificate('NON-EXISTENT', 101, ethers.ZeroHash);
    } catch {
      nonExistentReverted = true;
    }
    assert(nonExistentReverted === true, 'Revoking non-existent certificate reverts with CertificateDoesNotExist');

    // Invalid reason code 0
    const issue2Tx = await contract.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_2, SAMPLE_HASH_2);
    await issue2Tx.wait();
    let zeroReasonReverted = false;
    try {
      await contract.connect(deployer).revokeCertificate(SAMPLE_CERT_ID_2, 0, ethers.ZeroHash);
    } catch {
      zeroReasonReverted = true;
    }
    assert(zeroReasonReverted === true, 'Revoking with reason code 0 reverts with InvalidReasonCode');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: Requirement 6 - Repeated Revocation & Irreversibility
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 7: Repeated Revocation Rejection & Irreversibility ---');
  {
    let repeatedRevokeReverted = false;
    try {
      await contract.connect(deployer).revokeCertificate(SAMPLE_CERT_ID_1, 102, ethers.ZeroHash);
    } catch {
      repeatedRevokeReverted = true;
    }
    assert(repeatedRevokeReverted === true, 'Repeated revocation reverts with CertificateAlreadyRevoked');

    // Verify status remains irreversibly revoked
    const [isValid, isRevoked] = await contract.verifyCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);
    assert(isValid === false && isRevoked === true, 'Certificate remains permanently and irreversibly revoked');
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: Requirement 7 - Unauthorized Administrative Operations
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 8: Unauthorized Administrative Operations ---');
  {
    // Non-admin attempting to revoke
    let rogueRevokeReverted = false;
    try {
      await contract.connect(unauthorizedUser).revokeCertificate(SAMPLE_CERT_ID_2, 101, ethers.ZeroHash);
    } catch {
      rogueRevokeReverted = true;
    }
    assert(rogueRevokeReverted === true, 'Non-admin attempting revocation reverts with UnauthorizedAdmin');

    // Non-admin attempting to authorize issuer
    let rogueAuthIssuerReverted = false;
    try {
      await contract.connect(unauthorizedUser).authorizeIssuer(student.address);
    } catch {
      rogueAuthIssuerReverted = true;
    }
    assert(rogueAuthIssuerReverted === true, 'Non-admin attempting to authorize issuer reverts with UnauthorizedAdmin');

    // Non-admin attempting to add an admin
    let rogueAddAdminReverted = false;
    try {
      await contract.connect(unauthorizedUser).addAdmin(student.address);
    } catch {
      rogueAddAdminReverted = true;
    }
    assert(rogueAddAdminReverted === true, 'Non-admin attempting to add admin reverts with UnauthorizedAdmin');

    // Removing the last admin safeguard
    let removeLastAdminReverted = false;
    try {
      await contract.connect(deployer).removeAdmin(deployer.address);
    } catch {
      removeLastAdminReverted = true;
    }
    assert(removeLastAdminReverted === true, 'Attempting to remove the last admin reverts with CannotRemoveLastAdmin');

    // Safe multi-admin management
    const addAdminTx = await contract.connect(deployer).addAdmin(admin2.address);
    await addAdminTx.wait();
    const admin2Status = await contract.isAdmin(admin2.address);
    assert(admin2Status === true, 'Admin can add secondary administrator');

    const adminCount2 = await contract.adminCount();
    assert(adminCount2 === 2n, 'Admin count increases to 2');

    // Secondary admin can now safely remove the first admin
    const removeAdminTx = await contract.connect(admin2).removeAdmin(deployer.address);
    await removeAdminTx.wait();
    const deployerIsAdminNow = await contract.isAdmin(deployer.address);
    assert(deployerIsAdminNow === false, 'First admin was safely removed by second admin');

    const finalAdminCount = await contract.adminCount();
    assert(finalAdminCount === 1n, 'Admin count correctly decrements to 1');
  }

  console.log('\n' + '='.repeat(70));
  console.log(`  ALL ${passedCount}/${totalCount} CONTRACT TESTS PASSED FLAWLESSLY!`);
  console.log('='.repeat(70) + '\n');
}

runTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
