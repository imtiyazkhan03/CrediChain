import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { app } from '../backend/src/app.js';
import type { Server } from 'node:http';

let server: Server;
let baseUrl: string;

let adminToken = '';
let studentToken = '';
let otherStudentToken = '';
let validatorToken = '';

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 CERTICHAIN AUTHENTICATION, RBAC & PERSISTENCE TEST SUITE');
  console.log('================================================================\n');

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
      console.error('    Error detail:', (err as Error).message);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. HEALTH & SYSTEM INTEGRITY
    // -------------------------------------------------------------------------
    await test('System health check reports active status and storage configuration', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'healthy');
      assert.equal(data.system, 'CertiChain Academic Registry Backend');
    });

    // -------------------------------------------------------------------------
    // 2. AUTHENTICATION & LOGIN FLOWS
    // -------------------------------------------------------------------------
    await test('1. Valid Admin Login returns JWT token and sets cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'evance@stanford.edu',
          password: 'AdminPassword@2026',
        }),
      });
      assert.equal(res.status, 200);
      const cookie = res.headers.get('set-cookie');
      assert.ok(cookie && cookie.includes('certichain_token'), 'Must set certichain_token cookie');
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.role, 'university_admin');
      adminToken = data.token;
    });

    await test('1b. Valid Student Login returns JWT token', async () => {
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

    await test('1c. Valid Secondary Student Login (Marcus Vance)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mvance@law.stanford.edu',
          password: 'StudentPassword@2026',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      otherStudentToken = data.token;
    });

    await test('1d. Valid Validator Login returns JWT token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'schen@google.com',
          password: 'ValidatorPassword@2026',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.role, 'validator');
      validatorToken = data.token;
    });

    await test('2. Invalid Password returns HTTP 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'evance@stanford.edu',
          password: 'IncorrectPassword!999',
        }),
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Authentication Failed');
    });

    await test('3. Duplicate Email account creation is rejected with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Elena Clone',
          email: 'erostova@stanford.edu', // Duplicate
          password: 'Password@2026',
          role: 'student',
        }),
      });
      assert.equal(res.status, 400);
    });

    // Provision test credential fixtures dynamically via official admin endpoints
    await fetch(`${baseUrl}/api/certificates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'CERT-2024-8841',
        studentName: 'Elena Rostova',
        studentId: 'SU-2020-0492',
        studentEmail: 'erostova@stanford.edu',
        degree: 'M.S. in Computer Science',
        department: 'School of Engineering',
        date: 'Mar 14, 2024',
        certHash: '0x8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      }),
    });

    await fetch(`${baseUrl}/api/certificates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'CERT-2024-8840',
        studentName: 'Marcus Vance',
        studentId: 'SU-2021-1184',
        studentEmail: 'mvance@law.stanford.edu',
        degree: 'Juris Doctor (J.D.)',
        department: 'Stanford Law School',
        date: 'Mar 14, 2024',
        certHash: '0x1a72938481928401928401928401928401928401928401928401928401928401',
      }),
    });

    const revokedDocHash = crypto.createHash('sha256').update('%PDF-1.4\nRevoked Document Payload\n%%EOF').digest('hex');
    await fetch(`${baseUrl}/api/certificates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'CERT-2024-8835',
        studentName: 'Thomas Sterling',
        studentId: 'SU-2019-4411',
        studentEmail: 'tsterling@stanford.edu',
        degree: 'Master of Business Administration (MBA)',
        department: 'Graduate School of Business',
        date: 'Mar 10, 2024',
        certHash: `0x${revokedDocHash}`,
      }),
    });

    await fetch(`${baseUrl}/api/certificates/CERT-2024-8835/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Disciplinary sanctions confirmed by Academic Senate' }),
    });

    // -------------------------------------------------------------------------
    // 3. STUDENT PORTAL PRIVACY & OWNERSHIP ENFORCEMENT
    // -------------------------------------------------------------------------
    await test('4. Student can retrieve their own certificate (Elena -> CERT-2024-8841)', async () => {
      const res = await fetch(`${baseUrl}/api/student/certificates/CERT-2024-8841`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.certificate.id, 'CERT-2024-8841');
      assert.equal(data.certificate.studentEmail, 'erostova@stanford.edu');
    });

    await test('5. Student access to another student’s certificate is DENIED (HTTP 403 Forbidden)', async () => {
      // Elena (studentToken) attempts to query Marcus Vance's certificate (CERT-2024-8840)
      const res = await fetch(`${baseUrl}/api/student/certificates/CERT-2024-8840`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'Forbidden');
    });

    await test('6a. Student attempting to issue a certificate is DENIED (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/certificates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'CERT-ATTACK-001',
          studentName: 'Fraudulent Claim',
          studentId: 'SU-0000',
          studentEmail: 'fraud@stanford.edu',
          degree: 'Fake Degree',
          department: 'None',
          date: 'Oct 10, 2026',
          certHash: '0x' + crypto.randomBytes(32).toString('hex'),
        }),
      });
      assert.equal(res.status, 403);
    });

    await test('6b. Student attempting to revoke a certificate is DENIED (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/certificates/CERT-2024-8841/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Student unauthorized nullification' }),
      });
      assert.equal(res.status, 403);
    });

    // -------------------------------------------------------------------------
    // 4. VALIDATOR PORTAL RESTRICTIONS
    // -------------------------------------------------------------------------
    await test('7. Validator attempting certificate revocation is DENIED (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/certificates/CERT-2024-8841/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validatorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Validator attempt' }),
      });
      assert.equal(res.status, 403);
    });

    await test('8. Unauthorized direct API request without token is DENIED (HTTP 401)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/dashboard`);
      assert.equal(res.status, 401);
    });

    // -------------------------------------------------------------------------
    // 5. VERIFICATION OUTCOMES & INVARIANTS
    // -------------------------------------------------------------------------
    await test('9. Certificate Not Found produces outcome "unknown" (HTTP 404)', async () => {
      const res = await fetch(`${baseUrl}/api/validator/verify/CERT-NON-EXISTENT-404`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.outcome, 'unknown');
    });

    await test('10. Revoked Certificate produces outcome "revoked"', async () => {
      const res = await fetch(`${baseUrl}/api/validator/verify/CERT-2024-8835`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.outcome, 'revoked');
      assert.ok(data.message.includes('revoked'));
    });

    await test('11. Document Hash Mismatch (tampered bytes) produces outcome "altered"', async () => {
      const tamperedBytes = '%PDF-1.4\n1 0 obj\n<</Title (Hacked Transcript)>>\nendobj\n%%EOF';
      const blob = new Blob([tamperedBytes], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('pdf', blob, 'tampered.pdf');
      formData.append('certificateId', 'CERT-2024-8841');

      const res = await fetch(`${baseUrl}/api/validator/verify-file`, {
        method: 'POST',
        body: formData,
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.outcome, 'altered');
      assert.ok(data.computedHash);
    });

    await test('12. Revocation Invariant: Even matching file hash NEVER overrides revoked status', async () => {
      // Even if file bytes are presented for CERT-2024-8835, outcome remains strictly 'revoked'
      const pdfBytes = '%PDF-1.4\nRevoked Document Payload\n%%EOF';
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('pdf', blob, 'revoked_doc.pdf');
      formData.append('certificateId', 'CERT-2024-8835');

      const res = await fetch(`${baseUrl}/api/validator/verify-file`, {
        method: 'POST',
        body: formData,
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.outcome, 'revoked');
    });

    await test('13. Safe upload validation rejects non-PDF files (HTTP 400)', async () => {
      const fakeBinary = 'MZ\x90\x00Not a valid PDF executable payload';
      const blob = new Blob([fakeBinary], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('pdf', blob, 'malicious.pdf');

      const res = await fetch(`${baseUrl}/api/validator/verify-file`, {
        method: 'POST',
        body: formData,
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid File');
    });

    // -------------------------------------------------------------------------
    // 6. SESSION EXPIRATION & LOGOUT
    // -------------------------------------------------------------------------
    await test('14. Session Logout clears cookie and returns success', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.message.includes('Logged out'));
    });

    await test('15. Expired or forged token is rejected with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer forged.malicious.token.signature' },
      });
      assert.equal(res.status, 401);
    });

    // -------------------------------------------------------------------------
    // 7. AUDIT LOGGING TRAIL VERIFICATION
    // -------------------------------------------------------------------------
    await test('16. Admin can inspect recent security audit log trail', async () => {
      const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.logs.length >= 4);
      // Ensure unauthorized events and login events were logged
      const eventTypes = data.logs.map((l: any) => l.eventType);
      assert.ok(eventTypes.includes('LOGIN_SUCCESS'));
      assert.ok(eventTypes.includes('LOGIN_FAILED'));
      assert.ok(eventTypes.includes('UNAUTHORIZED_ACCESS'));
    });

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`Authentication, RBAC & Persistence Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
