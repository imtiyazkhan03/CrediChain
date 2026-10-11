import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';
import { auditLogModel } from '../models/auditLogModel.js';
import { env } from '../config/env.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  const user = await userModel.findByEmail(email);
  if (!user) {
    await auditLogModel.logEvent({
      eventType: 'LOGIN_FAILED',
      actorEmail: email || 'unknown',
      actorRole: 'unknown',
      ipAddress: ip,
      details: 'Failed login attempt: Account does not exist.',
      status: 'FAILURE',
    });

    res.status(401).json({
      error: 'Authentication Failed',
      message: 'Invalid email or password credentials.',
    });
    return;
  }

  const isPasswordValid = await userModel.verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    await auditLogModel.logEvent({
      eventType: 'LOGIN_FAILED',
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: ip,
      details: 'Failed login attempt: Password mismatch.',
      status: 'FAILURE',
    });

    res.status(401).json({
      error: 'Authentication Failed',
      message: 'Invalid email or password credentials.',
    });
    return;
  }

  // Generate secure JWT token
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

  // Set secure HttpOnly cookie
  res.cookie('certichain_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Record successful login in audit log
  await auditLogModel.logEvent({
    eventType: 'LOGIN_SUCCESS',
    actorEmail: user.email,
    actorRole: user.role,
    ipAddress: ip,
    details: `User session authenticated for role: ${user.role}.`,
    status: 'SUCCESS',
  });

  res.json({
    message: 'Authentication successful',
    token,
    user: userModel.toPublicUser(user),
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await auditLogModel.logEvent({
      eventType: 'LOGOUT',
      actorEmail: req.user.email,
      actorRole: req.user.role,
      ipAddress: req.ip,
      details: 'User logged out and session terminated.',
      status: 'SUCCESS',
    });
  }

  res.clearCookie('certichain_token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    message: 'Logged out successfully. Cookie cleared.',
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await userModel.findById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: userModel.toPublicUser(user),
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const user = await userModel.findByEmail(email);

  if (!user) {
    // Avoid user enumeration
    res.json({
      message: 'If the provided account exists, instructions have been dispatched.',
    });
    return;
  }

  await auditLogModel.logEvent({
    eventType: 'PASSWORD_RESET',
    actorEmail: user.email,
    actorRole: user.role,
    ipAddress: req.ip,
    details: 'Password reset request dispatched.',
    status: 'SUCCESS',
  });

  res.json({
    message: 'If the provided account exists, instructions have been dispatched.',
  });
}

export function getDemoAccounts(_req: Request, res: Response): void {
  res.json({
    demoAccounts: [
      {
        role: 'university_admin',
        email: 'evance@stanford.edu',
        password: 'AdminPassword@2026',
        label: 'Dr. Evelyn Vance (University Registrar)',
      },
      {
        role: 'student',
        email: 'erostova@stanford.edu',
        password: 'StudentPassword@2026',
        label: 'Elena Rostova (Student Alumna)',
      },
      {
        role: 'validator',
        email: 'schen@google.com',
        password: 'ValidatorPassword@2026',
        label: 'Sarah Chen (Google HR Validator)',
      },
    ],
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, role, institution, studentId, title } = req.body;

  let normalizedRole = role;
  if (role === 'college' || role === 'admin') normalizedRole = 'university_admin';
  if (role === 'recruiter') normalizedRole = 'validator';

  try {
    const user = await userModel.createUser({
      name: name.trim(),
      email: email.trim(),
      plainPassword: password,
      role: normalizedRole,
      institution: institution || 'Stanford University',
      studentId: studentId || (normalizedRole === 'student' ? `SU-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
      title: title || (normalizedRole === 'student' ? 'Student' : normalizedRole === 'validator' ? 'Talent Recruiter' : 'University Registrar'),
    });

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

    res.cookie('certichain_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await auditLogModel.logEvent({
      eventType: 'USER_REGISTERED',
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: req.ip || '127.0.0.1',
      details: `User registered with name: "${user.name}" and role: ${user.role}.`,
      status: 'SUCCESS',
    });

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: userModel.toPublicUser(user),
    });
  } catch (err: unknown) {
    res.status(400).json({
      error: 'Registration Failed',
      message: (err as Error).message || 'Failed to create user account.',
    });
  }
}
