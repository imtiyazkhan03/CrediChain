import type { Request, Response } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import { certificateModel, type CertificateRecord } from '../models/certificateModel.js';
import { userModel, type UserRole } from '../models/userModel.js';
import { auditLogModel } from '../models/auditLogModel.js';

export async function getAdminDashboard(_req: Request, res: Response): Promise<void> {
  const allCerts = await certificateModel.findAll();
  const allUsers = await userModel.findAll();
  const recentLogs = await auditLogModel.getRecentLogs(10);

  const totalIssued = allCerts.length;
  const totalRevoked = allCerts.filter((c) => c.status === 'Revoked').length;
  const activeCertificates = totalIssued - totalRevoked;
  const totalStudents = allUsers.filter((u) => u.role === 'student').length;

  res.json({
    metrics: {
      totalIssued,
      totalRevoked,
      activeCertificates,
      totalStudents,
      consensusHealth: '100% Operational',
    },
    recentCertificates: allCerts.slice(0, 5),
    recentAuditLogs: recentLogs,
  });
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  const roleFilter = req.query.role as string | undefined;
  let users = await userModel.findAll();

  if (roleFilter) {
    users = users.filter((u) => u.role === roleFilter);
  }

  res.json({
    count: users.length,
    users: users.map((u) => userModel.toPublicUser(u)),
  });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { name, email, password, role, studentId, title, institution, organizationId } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Name, email, password, and role are mandatory.',
    });
    return;
  }

  // Prevent unauthorized privilege escalation
  if (role === 'university_admin' && req.user?.role !== 'university_admin' && req.user?.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only existing university administrators can provision new administrator accounts.',
    });
    return;
  }

  try {
    const created = await userModel.createUser({
      name,
      email,
      plainPassword: password,
      role: role as UserRole,
      title,
      institution,
      studentId,
      organizationId,
    });

    await auditLogModel.logEvent({
      eventType: 'USER_CREATED',
      actorEmail: req.user?.email || 'admin',
      actorRole: req.user?.role || 'university_admin',
      targetId: created.id,
      ipAddress: req.ip,
      details: `Provisioned new account for ${created.name} (${created.email}) with role: ${created.role}.`,
      status: 'SUCCESS',
    });

    res.status(201).json({
      message: 'Account successfully created and provisioned.',
      user: userModel.toPublicUser(created),
    });
  } catch (err: unknown) {
    res.status(400).json({
      error: 'Creation Error',
      message: (err as Error)?.message || 'Failed to create user account.',
    });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const logs = await auditLogModel.getRecentLogs(limit);
  res.json({ count: logs.length, logs });
}

export async function issueCertificate(req: Request, res: Response): Promise<void> {
  const {
    id,
    studentName,
    studentId,
    studentEmail,
    degree,
    department,
    honors,
    date,
    txHash,
    fullTxHash,
    blockNumber,
    certHash,
    gpa,
    coSigner,
    coSignerRole,
  } = req.body;

  let computedCertHash = certHash;
  let savedPdfPath: string | undefined = undefined;

  if (req.file) {
    savedPdfPath = req.file.path;
    const fileBytes = fs.readFileSync(savedPdfPath);
    const actualHash = crypto.createHash('sha256').update(fileBytes).digest('hex');

    if (certHash) {
      const cleanExpected = certHash.toLowerCase().replace(/^0x/, '');
      if (actualHash !== cleanExpected) {
        fs.unlinkSync(savedPdfPath);
        res.status(400).json({
          error: 'Integrity Failure',
          message: `Uploaded file SHA-256 (0x${actualHash}) does not match declared hash (0x${cleanExpected}).`,
        });
        return;
      }
    } else {
      computedCertHash = `0x${actualHash}`;
    }
  }

  try {
    const newCert: Omit<CertificateRecord, 'createdAt' | 'updatedAt'> = {
      id: id.trim(),
      txHash: txHash || '0x' + crypto.randomBytes(4).toString('hex') + '...' + crypto.randomBytes(2).toString('hex'),
      fullTxHash: fullTxHash || '0x' + crypto.randomBytes(32).toString('hex'),
      certHash: (computedCertHash || '0x' + crypto.randomBytes(32).toString('hex')).toLowerCase(),
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      degree: degree.trim(),
      department: department.trim(),
      honors: honors ? honors.trim() : undefined,
      date: date.trim(),
      mintedDate: new Date().toUTCString(),
      blockNumber: blockNumber ? Number(blockNumber) : 19842100,
      status: 'Verified',
      onChainStatus: 'confirmed',
      chainName: 'Ethereum Sepolia',
      chainId: 11155111,
      contractAddress: '0x4B57300f232973EfcA2e6b80242aA3ED55E2e375',
      issuer: req.user?.name || 'Dr. Evelyn Vance',
      issuerRole: 'University Registrar & Custodian',
      coSigner: coSigner || 'Prof. Julian Thorpe',
      coSignerRole: coSignerRole || 'Dean of Academic Affairs',
      gpa: gpa ? gpa.trim() : undefined,
      pdfPath: savedPdfPath,
    };

    const created = await certificateModel.create(newCert);

    await auditLogModel.logEvent({
      eventType: 'CERTIFICATE_ISSUED',
      actorEmail: req.user?.email || 'admin',
      actorRole: req.user?.role || 'university_admin',
      targetId: created.id,
      ipAddress: req.ip,
      details: `Academic credential ${created.id} issued to ${created.studentName} (${created.degree}).`,
      status: 'SUCCESS',
    });

    res.status(201).json({
      message: 'Certificate successfully registered off-chain.',
      certificate: created,
    });
  } catch (err: unknown) {
    if (savedPdfPath && fs.existsSync(savedPdfPath)) {
      fs.unlinkSync(savedPdfPath);
    }
    res.status(400).json({
      error: 'Issuance Error',
      message: (err as Error)?.message || 'Failed to issue certificate.',
    });
  }
}

export async function revokeCertificate(req: Request, res: Response): Promise<void> {
  const { certificateId } = req.params;
  const { reason } = req.body;

  try {
    const revoked = await certificateModel.revoke(certificateId, reason);

    await auditLogModel.logEvent({
      eventType: 'CERTIFICATE_REVOKED',
      actorEmail: req.user?.email || 'admin',
      actorRole: req.user?.role || 'university_admin',
      targetId: certificateId,
      ipAddress: req.ip,
      details: `Academic credential ${certificateId} revoked. Reason: ${reason}.`,
      status: 'WARNING',
    });

    res.json({
      message: `Certificate ${certificateId} successfully marked revoked.`,
      certificate: revoked,
    });
  } catch (err: unknown) {
    res.status(404).json({
      error: 'Revocation Error',
      message: (err as Error)?.message || 'Failed to revoke certificate.',
    });
  }
}
