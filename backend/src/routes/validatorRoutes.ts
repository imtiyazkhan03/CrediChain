import { Router } from 'express';
import {
  getValidatorDashboard,
  verifyCertificateById,
  verifyCertificateFile,
} from '../controllers/validatorController.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { uploadMemory, validatePdfMagicBytes } from '../middleware/upload.js';
import { verifyLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(verifyLimiter);

// Protected Validator Dashboard
router.get(
  '/dashboard',
  authenticateToken,
  requireRole('validator', 'authority', 'verifier'),
  getValidatorDashboard
);

// Public / Validator Verification by ID
router.get('/verify/:certificateId', optionalAuth, verifyCertificateById);

// Public / Validator Verification by Uploaded PDF Bytes
router.post(
  '/verify-file',
  optionalAuth,
  uploadMemory.single('pdf'),
  validatePdfMagicBytes,
  verifyCertificateFile
);

export default router;
