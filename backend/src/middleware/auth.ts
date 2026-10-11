import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../models/userModel.js';
import { auditLogModel } from '../models/auditLogModel.js';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  studentId?: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  // 1. Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) {
      return token;
    }
  }

  // 2. Check HttpOnly cookie
  if (req.cookies && req.cookies.certichain_token) {
    return req.cookies.certichain_token;
  }

  return null;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required. Please authenticate.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || 'Invalid token';
    res.status(401).json({
      error: 'Unauthorized',
      message: `Token verification failed or expired: ${errorMsg}`,
    });
  }
}

/**
 * Checks role permission with alias mapping:
 * - 'university_admin' and 'admin' are equivalent
 * - 'validator', 'authority', and 'verifier' are equivalent
 */
export function requireRole(...allowedRoles: (UserRole | string)[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before checking role authorization.',
      });
      return;
    }

    const userRole = req.user.role;
    
    // Normalize aliases
    const normalizedUserRoles = [userRole];
    if (userRole === 'university_admin' || userRole === 'admin') {
      normalizedUserRoles.push('university_admin', 'admin');
    }
    if (userRole === 'validator' || userRole === 'authority' || userRole === 'verifier') {
      normalizedUserRoles.push('validator', 'authority', 'verifier');
    }

    const hasAccess = allowedRoles.some((role) => normalizedUserRoles.includes(role as UserRole));

    if (!hasAccess) {
      // Record unauthorized attempt in audit log
      await auditLogModel.logEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        actorEmail: req.user.email,
        actorRole: userRole,
        ipAddress: req.ip,
        details: `Access denied to ${req.originalUrl}. Required: [${allowedRoles.join(', ')}]`,
        status: 'WARNING',
      });

      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role "${userRole}" does not have permission for this portal. Required: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignore invalid token on optional auth
    }
  }
  next();
}
