import type { Request, Response, NextFunction } from 'express';

export function validateLoginPayload(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'A valid email address is required.',
    });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Password must be at least 6 characters long.',
    });
    return;
  }
  next();
}

export function validateIssuePayload(req: Request, res: Response, next: NextFunction): void {
  const {
    id,
    studentName,
    studentId,
    studentEmail,
    degree,
    department,
    date,
    certHash,
  } = req.body || {};

  const errors: string[] = [];

  if (!id || typeof id !== 'string' || id.trim().length < 4) {
    errors.push('Certificate ID must be at least 4 characters.');
  }
  if (!studentName || typeof studentName !== 'string' || studentName.trim().length < 2) {
    errors.push('Student name is required (minimum 2 characters).');
  }
  if (!studentId || typeof studentId !== 'string') {
    errors.push('Student Institutional ID is required.');
  }
  if (!studentEmail || typeof studentEmail !== 'string' || !studentEmail.includes('@')) {
    errors.push('Valid student email is required.');
  }
  if (!degree || typeof degree !== 'string') {
    errors.push('Degree title is required.');
  }
  if (!department || typeof department !== 'string') {
    errors.push('Department / Faculty is required.');
  }
  if (!date || typeof date !== 'string') {
    errors.push('Graduation / conferral date is required.');
  }
  if (!certHash || typeof certHash !== 'string' || !/^(0x)?[a-fA-F0-9]{64}$/.test(certHash.trim())) {
    errors.push('A valid 64-character SHA-256 hex document hash is required.');
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      details: errors,
    });
    return;
  }

  next();
}

export function validateRevokePayload(req: Request, res: Response, next: NextFunction): void {
  const { reason } = req.body || {};
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Certificate ID param is required.',
    });
    return;
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Revocation reason is mandatory (minimum 5 characters).',
    });
    return;
  }

  next();
}
