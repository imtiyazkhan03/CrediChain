import { Router } from 'express';
import { verifyById, verifyByDocumentFile } from '../controllers/verifyController.js';
import { uploadMemory, validatePdfMagicBytes } from '../middleware/upload.js';
import { verifyLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(verifyLimiter);

// Public verification by Certificate ID (strips sensitive student PII)
router.get('/:certificateId', verifyById);

// Public verification by uploaded document bytes
router.post(
  '/document',
  uploadMemory.single('pdf'),
  validatePdfMagicBytes,
  verifyByDocumentFile
);

export default router;
