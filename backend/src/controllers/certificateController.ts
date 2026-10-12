import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { certificateModel, type CertificateRecord } from '../models/certificateModel.js';
import { env } from '../config/env.js';

export async function getAllCertificates(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Admins, Authorities, and Validators can inspect certificates in registry
  if (
    user.role === 'admin' ||
    user.role === 'university_admin' ||
    user.role === 'authority' ||
    user.role === 'validator' ||
    user.role === 'verifier'
  ) {
    const certs = await certificateModel.findAll();
    res.json({ count: certs.length, certificates: certs });
    return;
  }

  // Students can ONLY view their own records
  if (user.role === 'student') {
    const certs = await certificateModel.findByStudent(user.email, user.studentId);
    res.json({ count: certs.length, certificates: certs });
    return;
  }

  // Verifier or other roles cannot list batch database certificates
  res.status(403).json({
    error: 'Forbidden',
    message: 'Verifiers and public accounts cannot browse the institutional certificate directory.',
  });
}

export async function getCertificateById(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const id = String(req.params.id);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const cert = await certificateModel.findById(id);
  if (!cert) {
    res.status(404).json({ error: 'Not Found', message: `Certificate ${id} not found.` });
    return;
  }

  // Admin and Authority can access full certificate
  if (
    user.role === 'admin' ||
    user.role === 'university_admin' ||
    user.role === 'authority' ||
    user.role === 'validator'
  ) {
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

export async function issueCertificate(req: Request, res: Response): Promise<void> {
  // Enforce admin-only issuance
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'university_admin')) {
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
    const isAnchored = Boolean(fullTxHash && fullTxHash.startsWith('0x') && fullTxHash.length === 66);
    const newCert: Omit<CertificateRecord, 'createdAt' | 'updatedAt'> = {
      id: id.trim(),
      txHash: isAnchored ? (txHash || `${fullTxHash.slice(0, 6)}...${fullTxHash.slice(-4)}`) : '',
      fullTxHash: isAnchored ? fullTxHash : '',
      certHash: computedCertHash.toLowerCase(),
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      degree: degree.trim(),
      department: department.trim(),
      honors: honors ? honors.trim() : undefined,
      date: date.trim(),
      mintedDate: isAnchored ? new Date().toUTCString() : 'Unanchored (Off-chain)',
      blockNumber: isAnchored && blockNumber ? Number(blockNumber) : 0,
      status: 'Verified',
      onChainStatus: isAnchored ? 'confirmed' : 'unregistered',
      chainName: isAnchored ? 'Ethereum Sepolia' : 'Off-Chain Only',
      chainId: isAnchored ? 11155111 : 0,
      contractAddress: '',
      issuer: req.user.name,
      issuerRole: 'University Registrar & Custodian',
      coSigner: coSigner || 'Prof. Julian Thorpe',
      coSignerRole: coSignerRole || 'Dean of Academic Affairs',
      gpa: gpa ? gpa.trim() : undefined,
      pdfPath: savedPdfPath,
    };

    const created = await certificateModel.create(newCert);
    res.status(201).json({
      message: isAnchored
        ? 'Certificate successfully registered and anchored on blockchain.'
        : 'Certificate successfully registered off-chain in MongoDB database.',
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

export async function anchorCertificate(req: Request, res: Response): Promise<void> {
  // Enforce admin-only anchoring
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'university_admin')) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only authorized university registrars can anchor certificates.',
    });
    return;
  }

  const id = String(req.params.id);
  const { txHash, fullTxHash, blockNumber, chainId, contractAddress } = req.body;

  if (!fullTxHash) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'fullTxHash is required to record real on-chain transaction.',
    });
    return;
  }

  try {
    const updated = await certificateModel.updateAnchor(id, {
      txHash: txHash || `${fullTxHash.slice(0, 6)}...${fullTxHash.slice(-4)}`,
      fullTxHash,
      blockNumber: Number(blockNumber) || 0,
      chainId: chainId ? Number(chainId) : 11155111,
      contractAddress: contractAddress || '',
    });

    res.json({
      message: `Certificate ${id} successfully anchored with real blockchain transaction.`,
      certificate: updated,
    });
  } catch (err: unknown) {
    res.status(400).json({
      error: 'Anchor Error',
      message: (err as Error)?.message || 'Failed to update certificate blockchain anchor.',
    });
  }
}

export async function revokeCertificate(req: Request, res: Response): Promise<void> {
  // Enforce admin-only revocation
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'university_admin')) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only university administrators can revoke academic certificates.',
    });
    return;
  }

  const id = String(req.params.id);
  const { reason } = req.body;

  try {
    const revoked = await certificateModel.revoke(id, reason);
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
export async function downloadDocument(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const id = String(req.params.id);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const cert = await certificateModel.findById(id);
  if (!cert) {
    res.status(404).json({ error: 'Not Found', message: `Certificate ${id} not found.` });
    return;
  }

  // Authorization check: Admin, Authority, or the specific student
  const isOwner =
    user.role === 'student' &&
    (cert.studentEmail.toLowerCase() === user.email.toLowerCase() ||
      (user.studentId && cert.studentId === user.studentId));

  const isStaff = user.role === 'admin' || user.role === 'university_admin' || user.role === 'authority';

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

  // If no physical file on disk yet, return 404 with helpful response
  res.status(404).json({
    error: 'File Unavailable',
    message: 'The physical PDF for this credential has not been archived to private disk storage yet. Please generate or upload the file.',
  });
}
