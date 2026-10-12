import type { Request, Response } from 'express';
import fs from 'fs';
import { certificateModel } from '../models/certificateModel.js';
import { userModel } from '../models/userModel.js';

export async function getStudentDashboard(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await userModel.findById(req.user.id);
  const studentCerts = await certificateModel.findByStudent(
    req.user.email,
    req.user.studentId
  );

  const activeCerts = studentCerts.filter((c) => c.status === 'Verified');
  const revokedCerts = studentCerts.filter((c) => c.status === 'Revoked');

  res.json({
    studentProfile: {
      name: user?.name || req.user.name,
      email: req.user.email,
      studentId: user?.studentId || req.user.studentId || 'SU-2020-0492',
      institution: user?.institution || 'Stanford University',
      title: user?.title || 'Graduate Student',
    },
    statistics: {
      totalCertificates: studentCerts.length,
      activeCertificates: activeCerts.length,
      revokedCertificates: revokedCerts.length,
    },
    certificates: studentCerts,
  });
}

export async function getStudentCertificates(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // STRICT OWNERSHIP FILTER: Students can only view their own certificates
  const studentCerts = await certificateModel.findByStudent(
    req.user.email,
    req.user.studentId
  );

  res.json({
    count: studentCerts.length,
    certificates: studentCerts,
  });
}

export async function getStudentCertificateById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const certificateId = String(req.params.certificateId);
  const cert = await certificateModel.findById(certificateId);

  if (!cert) {
    res.status(404).json({
      error: 'Not Found',
      message: `Certificate "${certificateId}" not found.`,
    });
    return;
  }

  // STRICT OWNERSHIP ENFORCEMENT:
  const isOwner =
    cert.studentEmail.toLowerCase() === req.user.email.toLowerCase() ||
    (req.user.studentId && cert.studentId === req.user.studentId);

  if (!isOwner) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: You do not have permission to view another student’s certificate.',
    });
    return;
  }

  res.json({ certificate: cert });
}

export async function downloadStudentDocument(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const certificateId = String(req.params.certificateId);
  const cert = await certificateModel.findById(certificateId);

  if (!cert) {
    res.status(404).json({ error: 'Not Found', message: `Certificate ${certificateId} not found.` });
    return;
  }

  const isOwner =
    cert.studentEmail.toLowerCase() === req.user.email.toLowerCase() ||
    (req.user.studentId && cert.studentId === req.user.studentId);

  if (!isOwner) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: You cannot download a document that does not belong to you.',
    });
    return;
  }

  if (cert.pdfPath && fs.existsSync(cert.pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.id}.pdf"`);
    fs.createReadStream(cert.pdfPath).pipe(res);
    return;
  }

  res.status(404).json({
    error: 'File Unavailable',
    message: 'The physical PDF for this credential is not available on disk storage.',
  });
}
