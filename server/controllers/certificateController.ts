import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { certificateModel, type CertificateRecord } from '../models/certificateModel.js';
import { env } from '../config/env.js';

export function getAllCertificates(req: Request, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Admins and Authorities can inspect all certificates in registry
  if (user.role === 'admin' || user.role === 'authority') {
    const certs = certificateModel.findAll();
    res.json({ count: certs.length, certificates: certs });
    return;
  }

  // Students can ONLY view their own records
  if (user.role === 'student') {
    const certs = certificateModel.findByStudent(user.email, user.studentId);
    res.json({ count: certs.length, certificates: certs });
    return;
  }

  // Verifier or other roles cannot list batch database certificates
  res.status(403).json({
    error: 'Forbidden',
    message: 'Verifiers and public accounts cannot browse the institutional certificate directory.',
  });
}

export function getCertificateById(req: Request, res: Response): void {
  const user = req.user;
  const { id } = req.params;

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const cert = certificateModel.findById(id);
  if (!cert) {
    res.status(404).json({ error: 'Not Found', message: `Certificate ${id} not found.` });
    return;
  }

  // Admin and Authority can access full certificate
  if (user.role === 'admin' || user.role === 'authority') {
    res.json({ certificate: cert });
    return;
  }

  // Student can only access their own certificate
  if (user.role === 'student') {
    if (
      cert.studentEmail.toLowerCase() === user.email.toLowerCase() ||
      (user.studentId && cert.studentId === user.studentId)
    ) {
      res.json({ certificate: cert });
      return;
    }
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not authorized to view another student\'s full record.',
    });
    return;
  }

  res.status(403).json({
    error: 'Forbidden',
    message: 'Public verifiers must query via the public verification endpoint.',
  });
}

export function issueCertificate(req: Request, res: Response): void {
  // Enforce admin-only issuance
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only authorized university registrars (admin role) can issue academic credentials.',
    });
    return;
  }

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

  // If a PDF document was uploaded with the request
  if (req.file) {
    savedPdfPath = req.file.path;
    const fileBytes = fs.readFileSync(savedPdfPath);
    const actualHash = crypto.createHash('sha256').update(fileBytes).digest('hex');

    // If certHash was provided, verify it matches the actual uploaded file bytes
    if (certHash) {
      const cleanExpected = certHash.toLowerCase().replace(/^0x/, '');
      if (actualHash !== cleanExpected) {
        // Remove corrupted upload
        fs.unlinkSync(savedPdfPath);
        res.status(400).json({
          error: 'Integrity Failure',
          message: `Uploaded file SHA-256 (0x${actualHash}) does not match declared document hash (0x${cleanExpected}).`,
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
      certHash: computedCertHash.toLowerCase(),
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
      issuer: req.user.name,
      issuerRole: 'University Registrar & Custodian',
      coSigner: coSigner || 'Prof. Julian Thorpe',
      coSignerRole: coSignerRole || 'Dean of Academic Affairs',
      gpa: gpa ? gpa.trim() : undefined,
      pdfPath: savedPdfPath,
    };

    const created = certificateModel.create(newCert);
    res.status(201).json({
      message: 'Certificate successfully registered off-chain.',
      certificate: created,
    });
  } catch (err: unknown) {
    // If saving failed and file was uploaded, clean up
    if (savedPdfPath && fs.existsSync(savedPdfPath)) {
      fs.unlinkSync(savedPdfPath);
    }
    res.status(400).json({
      error: 'Issuance Error',
      message: (err as Error)?.message || 'Failed to issue certificate.',
    });
  }
}

export function revokeCertificate(req: Request, res: Response): void {
  // Enforce admin-only revocation
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only university administrators can revoke academic certificates.',
    });
    return;
  }

  const { id } = req.params;
  const { reason } = req.body;

  try {
    const revoked = certificateModel.revoke(id, reason);
    res.json({
      message: `Certificate ${id} marked revoked in off-chain database.`,
      certificate: revoked,
    });
  } catch (err: unknown) {
    res.status(404).json({
      error: 'Revocation Error',
      message: (err as Error)?.message || 'Failed to revoke certificate.',
    });
  }
}

/**
 * SECURE PRIVATE DOCUMENT DOWNLOAD
 * Only the certificate recipient (student) or authorized institutional officers (admin, authority)
 * may download the raw certificate PDF document.
 */
export function downloadDocument(req: Request, res: Response): void {
  const user = req.user;
  const { id } = req.params;

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const cert = certificateModel.findById(id);
  if (!cert) {
    res.status(404).json({ error: 'Not Found', message: `Certificate ${id} not found.` });
    return;
  }

  // Authorization check: Admin, Authority, or the specific student
  const isOwner =
    user.role === 'student' &&
    (cert.studentEmail.toLowerCase() === user.email.toLowerCase() ||
      (user.studentId && cert.studentId === user.studentId));

  const isStaff = user.role === 'admin' || user.role === 'authority';

  if (!isOwner && !isStaff) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not authorized to download this private academic document.',
    });
    return;
  }

  // If we have a local physical file on disk:
  if (cert.pdfPath && fs.existsSync(cert.pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.id}.pdf"`);
    fs.createReadStream(cert.pdfPath).pipe(res);
    return;
  }

  // If no physical file on disk yet (e.g. seeded demo certificates), return 404 with helpful response
  res.status(404).json({
    error: 'File Unavailable',
    message: 'The physical PDF for this credential has not been archived to private disk storage yet. Use the client vector PDF renderer or issue a new credential with file upload.',
  });
}
