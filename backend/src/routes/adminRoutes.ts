import { Router } from 'express';
import {
  getAdminDashboard,
  getUsers,
  createUser,
  getAuditLogs,
  issueCertificate,
  revokeCertificate,
} from '../controllers/adminController.js';
import { getAllCertificates } from '../controllers/certificateController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadDisk, validatePdfMagicBytes } from '../middleware/upload.js';
import { validateIssuance, validateRevocation } from '../validators/certificateValidator.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(apiLimiter);
router.use(authenticateToken);
router.use(requireRole('university_admin', 'admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/certificates', getAllCertificates);
router.post(
  '/certificates',
  uploadDisk.single('pdf'),
  validatePdfMagicBytes,
  validateIssuance,
  issueCertificate
);
router.post(
  '/certificates/:certificateId/revoke',
  validateRevocation,
  revokeCertificate
);
router.get('/audit-logs', getAuditLogs);

export default router;
