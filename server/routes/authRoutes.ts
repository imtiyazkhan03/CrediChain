import { Router } from 'express';
import { login, getMe, getDemoAccounts } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateLoginPayload } from '../middleware/validate.js';

const router = Router();

router.post('/login', authLimiter, validateLoginPayload, login);
router.get('/me', authenticateToken, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
