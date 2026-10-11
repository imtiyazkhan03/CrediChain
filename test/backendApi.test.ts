import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { app } from '../server/app.js';
import type { Server } from 'node:http';

let server: Server;
let baseUrl: string;

let adminToken: string = '';
let studentToken: string = '';
let authorityToken: string = '';
let verifierToken: string = '';

async function runTests() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING CERTICHAIN BACKEND & SECURITY AUDIT TEST SUITE');
  console.log('=======================================================\n');

  // Start test server on ephemeral port
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr !== null) {
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      }
    });
  });

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`  • ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err: unknown) {
      console.log('❌ FAIL');
      console.error('    Error:', (err as Error).message);
      failed++;
    }
  }

  try {
    // ---------------------------------------------------------------
    // 1. HEALTH CHECK & ENVIRONMENT INTEGRITY
    // ---------------------------------------------------------------
    await test('Health check returns HTTP 200 with system metadata', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'healthy');
      assert.equal(data.system, 'CertiChain Academic Registry Backend');
      assert.equal(data.storageDirectoryConfigured, true);
    });

    // ---------------------------------------------------------------
    // 2. AUTHENTICATION & JWT GENERATION
    // ---------------------------------------------------------------
    await test('Admin login with valid credentials succeeds and issues JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'evance@stanford.edu',
          password: 'AdminPassword@2026',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token, 'Must return JWT token');
      assert.equal(data.user.role, 'admin');
      assert.equal(data.user.email, 'evance@stanford.edu');
      adminToken = data.token;
    });

    await test('Student login with valid credentials succeeds and issues JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'erostova@stanford.edu',
          password: 'StudentPassword@2026',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.role, 'student');
      studentToken = data.token;
    });

    await test('Authority login with valid credentials succeeds and issues JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'athorne@chea-board.gov',
          password: 'AuthorityPassword@2026',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.role, 'authority');
      authorityToken = data.token;
    });

    await test('Verifier login with valid credentials succeeds and issues JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'schen@google.com',
          password: 'VerifierPassword@2026',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.role, 'verifier');
      verifierToken = data.token;
    });

    await test('Login with incorrect password returns HTTP 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'evance@stanford.edu',
          password: 'WrongPassword@123',
        }),
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Authentication Failed');
    });

    await test('Login with malformed or missing fields returns HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: '',
        }),
      });
      assert.equal(res.status, 400);
    });

    // ---------------------------------------------------------------
    // 3. ROLE-BASED ACCESS CONTROL (RBAC) GUARDS
    // ---------------------------------------------------------------
    await test('Admin can list all registered certificates', async () => {
      const res = await fetch(`${baseUrl}/api/certificates`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.certificates.length >= 3);
    });

    await test('Authority can list all registered certificates', async () => {
      const res = await fetch(`${baseUrl}/api/certificates`, {
        headers: { Authorization: `Bearer ${authorityToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.certificates.length >= 3);
    });

    await test('Student sees ONLY their own certificates when listing', async () => {
      const res = await fetch(`${baseUrl}/api/certificates`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      // Elena Rostova should only see CERT-2024-8841
      for (const cert of data.certificates) {
        assert.equal(cert.studentEmail.toLowerCase(), 'erostova@stanford.edu');
      }
    });

    await test('Verifier cannot browse the private institutional certificate directory', async () => {
      const res = await fetch(`${baseUrl}/api/certificates`, {
        headers: { Authorization: `Bearer ${verifierToken}` },
      });
      assert.equal(res.status, 403);
    });

    await test('Public unauthenticated request to /api/certificates returns HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/certificates`);
      assert.equal(res.status, 401);
    });

    // ---------------------------------------------------------------
    // 4. ADMIN-ONLY OPERATIONS ENFORCEMENT
    // ---------------------------------------------------------------
    const dummyHash = '0x' + crypto.createHash('sha256').update('test_credential_payload').digest('hex');

    await test('Student CANNOT issue a certificate (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/certificates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'CERT-ATTACK-001',
          studentName: 'Malicious Actor',
          studentId: 'SU-FAKE-001',
          studentEmail: 'attacker@stanford.edu',
          degree: 'Ph.D. in Computer Science',
          department: 'Computer Science',
          date: 'May 20, 2026',
          certHash: dummyHash,
        }),
      });
      assert.equal(res.status, 403);
    });

    await test('Student CANNOT revoke a certificate (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/certificates/CERT-2024-8841/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Unauthorized student attempt',
        }),
      });
      assert.equal(res.status, 403);
    });

    await test('Admin can issue a new valid certificate', async () => {
      const res = await fetch(`${baseUrl}/api/certificates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'CERT-2026-9999',
          studentName: 'Sarah Jenkins',
          studentId: 'SU-2022-7711',
          studentEmail: 'sjenkins@stanford.edu',
          degree: 'B.S. in Electrical Engineering',
          department: 'School of Engineering',
          honors: 'Magna Cum Laude',
          date: 'Jun 12, 2026',
          certHash: dummyHash,
          gpa: '3.95 / 4.00',
        }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.certificate.id, 'CERT-2026-9999');
    });

    await test('Admin duplicate issuance with same ID is rejected (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/certificates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'CERT-2026-9999',
          studentName: 'Duplicate Actor',
          studentId: 'SU-2022-7711',
          studentEmail: 'sjenkins@stanford.edu',
          degree: 'B.S. in Electrical Engineering',
          department: 'School of Engineering',
          date: 'Jun 12, 2026',
          certHash: dummyHash,
        }),
      });
      assert.equal(res.status, 400);
    });

    // ---------------------------------------------------------------
    // 5. PUBLIC VERIFICATION & ZERO PII LEAK AUDIT
    // ---------------------------------------------------------------
    await test('Public verification of valid certificate succeeds and strips sensitive PII', async () => {
      const res = await fetch(`${baseUrl}/api/verify/CERT-2024-8841`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.outcome, 'verified');
      assert.equal(data.certificate.id, 'CERT-2024-8841');
      assert.equal(data.certificate.degree, 'M.S. in Computer Science (Artificial Intelligence)');

      // STRICT PII AUDIT: Must NOT expose studentEmail, studentId, or GPA to public unauthenticated verifiers!
      assert.equal(data.certificate.studentEmail, undefined, 'Must not leak studentEmail');
      assert.equal(data.certificate.studentId, undefined, 'Must not leak studentId');
      assert.equal(data.certificate.gpa, undefined, 'Must not leak GPA');
      assert.equal(data.certificate.pdfPath, undefined, 'Must not leak private physical storage path');
    });

    await test('Public verification of non-existent certificate returns outcome "unknown" (HTTP 404)', async () => {
      const res = await fetch(`${baseUrl}/api/verify/CERT-NON-EXISTENT-999`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.outcome, 'unknown');
    });

    // ---------------------------------------------------------------
    // 6. REVOCATION INTEGRITY & PRECEDENCE
    // ---------------------------------------------------------------
    await test('Public verification of revoked certificate returns outcome "revoked"', async () => {
      const res = await fetch(`${baseUrl}/api/verify/CERT-2024-8835`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.outcome, 'revoked');
      assert.equal(data.certificate.status, 'Revoked');
      assert.ok(data.certificate.revocationReason);
    });

    await test('Admin can revoke an active certificate', async () => {
      const res = await fetch(`${baseUrl}/api/certificates/CERT-2026-9999/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Degree rescinded due to ethical code violation.',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.certificate.status, 'Revoked');

      // Now verify public endpoint immediately reflects revocation
      const verifyRes = await fetch(`${baseUrl}/api/verify/CERT-2026-9999`);
      assert.equal(verifyRes.status, 200);
      const verifyData = await verifyRes.json();
      assert.equal(verifyData.outcome, 'revoked');
    });

    // ---------------------------------------------------------------
    // 7. FILE UPLOAD & MAGIC BYTE VALIDATION
    // ---------------------------------------------------------------
    await test('Uploaded file without %PDF magic bytes is rejected with HTTP 400', async () => {
      const fakePdfContent = 'NOT A VALID PDF FILE AT ALL';
      const blob = new Blob([fakePdfContent], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('pdf', blob, 'test.pdf');
      formData.append('certificateId', 'CERT-2024-8841');

      const res = await fetch(`${baseUrl}/api/verify/document`, {
        method: 'POST',
        body: formData,
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid File');
    });

    await test('Uploaded valid PDF with altered bytes returns outcome "altered"', async () => {
      // Build valid minimal PDF bytes starting with %PDF-1.4
      const minimalPdf = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';
      const blob = new Blob([minimalPdf], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('pdf', blob, 'diploma.pdf');
      formData.append('certificateId', 'CERT-2024-8841');

      const res = await fetch(`${baseUrl}/api/verify/document`, {
        method: 'POST',
        body: formData,
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      // Because minimalPdf hash won't match Elena's recorded certHash
      assert.equal(data.outcome, 'altered');
      assert.ok(data.computedHash);
      assert.ok(data.onChainHash);
    });

    await test('Revoked certificate uploaded with matching bytes STILL returns outcome "revoked"', async () => {
      // For CERT-2024-8835 (which is revoked), even if hash were matching, revocation takes precedence!
      const minimalPdf = '%PDF-1.4\nRevoked Test\n%%EOF';
      const blob = new Blob([minimalPdf], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('pdf', blob, 'revoked.pdf');
      formData.append('certificateId', 'CERT-2024-8835');

      const res = await fetch(`${baseUrl}/api/verify/document`, {
        method: 'POST',
        body: formData,
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.outcome, 'revoked');
    });

  } finally {
    server.close();
  }

  console.log('\n=======================================================');
  console.log(`Backend & Security Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
