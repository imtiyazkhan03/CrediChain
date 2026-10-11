import { Router } from 'express';
import {
  getAllCertificates,
  getCertificateById,
  issueCertificate,
  anchorCertificate,
  revokeCertificate,
  downloadDocument,
} from '../controllers/certificateController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadDisk, validatePdfMagicBytes } from '../middleware/upload.js';
import { validateIssuePayload, validateRevokePayload } from '../middleware/validate.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(apiLimiter);

// Listing certificates: filtered by role (admin/authority see all, student sees only their own)
router.get('/', authenticateToken, getAllCertificates);

// Specific certificate details
router.get('/:id', authenticateToken, getCertificateById);

// Admin-only issuance: supports optional file upload
router.post(
  '/',
  authenticateToken,
  requireRole('admin'),
  uploadDisk.single('pdf'),
  validatePdfMagicBytes,
  validateIssuePayload,
  issueCertificate
);

// Admin-only on-chain anchor update (records real mined MetaMask transaction)
router.patch(
  '/:id/anchor',
  authenticateToken,
  requireRole('admin'),
  anchorCertificate
);

// Admin-only revocation
router.post(
  '/:id/revoke',
  authenticateToken,
  requireRole('admin'),
  validateRevokePayload,
  revokeCertificate
);

// Secure private document download (admin, authority, or owning recipient)
router.get('/:id/document', authenticateToken, downloadDocument);

export default router;
