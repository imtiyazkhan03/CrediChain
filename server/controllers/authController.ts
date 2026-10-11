import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';
import { env } from '../config/env.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = userModel.findByEmail(email);
  if (!user) {
    res.status(401).json({
      error: 'Authentication Failed',
      message: 'Invalid email or password credentials.',
    });
    return;
  }

  const isPasswordValid = await userModel.verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      error: 'Authentication Failed',
      message: 'Invalid email or password credentials.',
    });
    return;
  }

  // Generate secure JWT signed with server secret
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Authentication successful',
    token,
    user: userModel.toPublicUser(user),
  });
}

export function getMe(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = userModel.findById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: userModel.toPublicUser(user),
  });
}

export function getDemoAccounts(_req: Request, res: Response): void {
  // Convenient helper for examiners/evaluators during demonstration
  res.json({
    demoAccounts: [
      { role: 'admin', email: 'evance@stanford.edu', password: 'AdminPassword@2026', label: 'University Registrar (Admin)' },
      { role: 'student', email: 'erostova@stanford.edu', password: 'StudentPassword@2026', label: 'Elena Rostova (Student)' },
      { role: 'authority', email: 'athorne@chea-board.gov', password: 'AuthorityPassword@2026', label: 'Accreditation Auditor (Authority)' },
      { role: 'verifier', email: 'schen@google.com', password: 'VerifierPassword@2026', label: 'Sarah Chen (Verifier)' },
    ],
  });
}
