import type { Request, Response, NextFunction } from 'express';

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
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

export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { name, email, password, role } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Name is required.',
    });
    return;
  }
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
  if (!role || typeof role !== 'string') {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Role is required (college, student, recruiter).',
    });
    return;
  }
  next();
}
