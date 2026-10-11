import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../models/userModel.js';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  studentId?: string;
  name: string;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Middleware: Verifies Bearer JWT in Authorization header.
 * Rejects requests with 401 if missing/invalid or expired.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required. Please authenticate.',
    });
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization header format. Expected "Bearer <token>".',
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
      message: `Token verification failed: ${errorMsg}`,
    });
  }
}

/**
 * Middleware: Role-based authorization guard.
 * Rejects requests with 403 Forbidden if current user role is not authorized.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before checking role authorization.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role "${req.user.role}" does not have permission for this resource. Required: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Optional token extraction.
 * Does not reject unauthenticated calls, but populates req.user if a valid token is provided.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignored for optional auth
    }
  }
  next();
}
