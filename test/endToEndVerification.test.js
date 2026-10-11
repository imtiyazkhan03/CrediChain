import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ganache from 'ganache';
import { ethers } from 'ethers';
import { generateAcademicCertificatePdf } from '../src/services/pdfService.ts';
import { computeSha256 } from '../src/services/hashService.ts';
import {
  storeCertificateDocument,
  retrieveCertificateDocument,
  saveCertificateMetadata,
  clearStorage,
} from '../src/services/storageService.ts';
import {
  verifyCertificateEndToEnd,
} from '../src/services/verificationEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactPath = path.resolve(__dirname, '../contracts/AcademicCertificateRegistry.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const { abi, bytecode } = artifact;

async function runEndToEndTests() {
  console.log('='.repeat(75));
  console.log('  CertiChain End-to-End Issuance & Verification Test Suite');
  console.log('='.repeat(75));

  // Initialize in-memory EVM
  const ganacheProvider = ganache.provider({
    logging: { quiet: true },
    wallet: { totalAccounts: 4, defaultBalance: 500 },
  });
  const provider = new ethers.BrowserProvider(ganacheProvider);
  const [deployer, issuer] = await provider.listAccounts();

  // Deploy Registry Contract
  const factory = new ethers.ContractFactory(abi, bytecode, deployer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  // Authorize Issuer
  await (await contract.connect(deployer).authorizeIssuer(issuer.address)).wait();

  console.log(`Registry deployed at: ${contractAddress}`);
  console.log(`Authorized Issuer:    ${issuer.address}\n`);

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`  [PASS] #${total}: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] #${total}: ${testName}`);
      if (details) console.error(`         Reason: ${details}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  clearStorage();

  const TEST_CERT_ID = 'CERT-2024-STANFORD-001';
  let originalPdfBytes;
  let originalDocHash;

  // ---------------------------------------------------------------------------
  // STEP 1: Full Issuance Pipeline
  // ---------------------------------------------------------------------------
  console.log('--- Phase 1: End-to-End Issuance Pipeline ---');
  {
    // 1. Validate student and academic details
    const studentData = {
      certId: TEST_CERT_ID,
      studentName: 'Julianne Adams',
      studentId: 'SU-2022-4819',
      degree: 'Master of Science in Computer Science',
      department: 'School of Engineering',
      honors: 'Summa Cum Laude',
      conferralDate: 'June 16, 2024',
      issuerName: 'Dr. Evelyn Vance',
      issuerRole: 'University Registrar',
      coSignerName: 'Prof. Julian Thorpe',
      coSignerRole: 'Dean of Academic Affairs',
      verificationBaseUrl: 'https://certichain.stanford.edu',
    };

    assert(Boolean(studentData.studentName && studentData.studentId), 'Student details validated');

    // 2. Generate a professional academic certificate PDF
    originalPdfBytes = await generateAcademicCertificatePdf(studentData);
    assert(originalPdfBytes instanceof Uint8Array && originalPdfBytes.length > 1000, 'Academic certificate PDF generated');

    // 3. Compute SHA-256 hash over exact final PDF bytes
    originalDocHash = computeSha256(originalPdfBytes);
    assert(originalDocHash.startsWith('0x') && originalDocHash.length === 66, 'SHA-256 computed over exact PDF bytes');

    // 4. Store PDF privately and save metadata off-chain
    await storeCertificateDocument(TEST_CERT_ID, originalPdfBytes);
    await saveCertificateMetadata(TEST_CERT_ID, {
      id: TEST_CERT_ID,
      studentName: studentData.studentName,
      studentId: studentData.studentId,
      degree: studentData.degree,
      department: studentData.department,
      honors: studentData.honors,
      issueDate: studentData.conferralDate,
      documentHash: originalDocHash,
      issuer: studentData.issuerName,
      issuerRole: studentData.issuerRole,
      coSigner: studentData.coSignerName,
      coSignerRole: studentData.coSignerRole,
      status: 'Verified',
    });

    const retrievedDoc = await retrieveCertificateDocument(TEST_CERT_ID);
    assert(retrievedDoc !== null && retrievedDoc.length === originalPdfBytes.length, 'PDF document stored privately and retrievable');

    // 5. Register certificate ID and hash on-chain through authorized issuer's wallet
    const tx = await contract.connect(issuer).issueCertificate(TEST_CERT_ID, originalDocHash);
    const receipt = await tx.wait();
    assert(receipt.status === 1, 'Certificate registered on-chain by authorized issuer');

    // 6. Verify on-chain record after confirmation
    const onChainRecord = await contract.getCertificate(TEST_CERT_ID);
    assert(onChainRecord.documentHash === originalDocHash, 'On-chain documentHash matches exact generated PDF hash');
    assert(onChainRecord.isRevoked === false, 'On-chain record is initially active');
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Original Authentic PDF Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 1: Original Authentic PDF Verification ---');
  {
    const result = await verifyCertificateEndToEnd(TEST_CERT_ID, contract, originalPdfBytes);
    assert(result.outcome === 'verified', 'Original PDF produces VERIFIED outcome');
    assert(result.hasDocument === true, 'Verifier confirms document was provided');
    assert(result.computedHash === originalDocHash, 'Computed hash matches on-chain anchor exactly');
    assert(result.onChainRecord.isRevoked === false, 'Confirmed record is not revoked');
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Altered / Tampered PDF Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: Altered / Tampered PDF Verification ---');
  {
    // Clone and tamper 1 byte in the PDF buffer
    const tamperedPdfBytes = new Uint8Array(originalPdfBytes);
    tamperedPdfBytes[tamperedPdfBytes.length - 20] ^= 0xff; // Invert a byte

    const tamperedHash = computeSha256(tamperedPdfBytes);
    assert(tamperedHash !== originalDocHash, 'Tampered file has a completely different SHA-256 digest');

    const result = await verifyCertificateEndToEnd(TEST_CERT_ID, contract, tamperedPdfBytes);
    assert(result.outcome === 'altered', 'Tampered PDF produces ALTERED outcome');
    assert(result.computedHash !== result.onChainRecord.documentHash, 'Verifier flags hash discrepancy');
    assert(result.message.includes('Tampering detected'), 'Clear tampering message returned');
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Unknown Certificate ID Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: Unknown Certificate ID ---');
  {
    const result = await verifyCertificateEndToEnd('CERT-NON-EXISTENT-404', contract, originalPdfBytes);
    assert(result.outcome === 'unknown', 'Non-existent certificate ID produces UNKNOWN outcome');
    assert(result.message.includes('not found') || result.message.includes('not registered'), 'Unknown state message returned');
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Revoked Record (Strict Rule: Matching Hash NEVER overrides Revocation)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 4: Revocation (Matching Hash NEVER overrides Revoked Status) ---');
  {
    // Revoke certificate on-chain by administrator
    const reasonCode = 101; // Academic Dishonesty
    const docketRef = ethers.keccak256(ethers.toUtf8Bytes('Disciplinary Hearing #4921'));
    const revokeTx = await contract.connect(deployer).revokeCertificate(TEST_CERT_ID, reasonCode, docketRef);
    await revokeTx.wait();

    // Verify contract state is revoked
    const record = await contract.getCertificate(TEST_CERT_ID);
    assert(record.isRevoked === true, 'Certificate is confirmed revoked on smart contract');

    // Run verification PASSING THE ORIGINAL AUTHENTIC PDF!
    const result = await verifyCertificateEndToEnd(TEST_CERT_ID, contract, originalPdfBytes);
    assert(result.outcome === 'revoked', 'Revoked certificate produces REVOKED outcome even with exact matching PDF');
    assert(result.computedHash === originalDocHash, 'PDF hash matches original hash, yet status is strictly revoked');
    assert(result.onChainRecord.reasonCode === reasonCode, 'Revocation audit reason code 101 preserved');
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Missing Document File Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 5: Missing Document File Verification ---');
  {
    // Register a second certificate without storing the document
    const SECOND_ID = 'CERT-2024-STANFORD-002';
    const dummyHash = ethers.sha256(ethers.toUtf8Bytes('dummy document payload'));
    await (await contract.connect(issuer).issueCertificate(SECOND_ID, dummyHash)).wait();

    // Query without providing bytes and without local storage
    clearStorage();
    const result = await verifyCertificateEndToEnd(SECOND_ID, contract, null);
    assert(result.hasDocument === false, 'Verifier notes document file is not provided');
    assert(result.outcome === 'verified', 'On-chain record is confirmed while awaiting file upload');
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Blockchain / Network Connection Failures
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 6: Blockchain Connection Failure (UNAVAILABLE State) ---');
  {
    // Simulated offline/broken contract reader
    const offlineReader = {
      getCertificate: async () => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:8545: Network connection offline');
      },
    };

    const result = await verifyCertificateEndToEnd(TEST_CERT_ID, offlineReader, originalPdfBytes);
    assert(result.outcome === 'unavailable', 'Network failure produces UNAVAILABLE outcome (never invalid or verified)');
    assert(result.message.includes('unavailable'), 'Clear network failure explanation returned');
    assert(result.outcome !== 'altered' && result.outcome !== 'verified', 'Strictly avoids claiming invalid or verified when offline');
  }

  console.log('\n' + '='.repeat(75));
  console.log(`  ALL ${passed}/${total} END-TO-END ISSUANCE & VERIFICATION TESTS PASSED!`);
  console.log('='.repeat(75) + '\n');
}

runEndToEndTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
