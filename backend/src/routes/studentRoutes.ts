import { Router } from 'express';
import {
  getStudentDashboard,
  getStudentCertificates,
  getStudentCertificateById,
  downloadStudentDocument,
} from '../controllers/studentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(apiLimiter);
router.use(authenticateToken);
router.use(requireRole('student'));

router.get('/dashboard', getStudentDashboard);
router.get('/certificates', getStudentCertificates);
router.get('/certificates/:certificateId', getStudentCertificateById);
router.get('/certificates/:certificateId/download', downloadStudentDocument);

export default router;
