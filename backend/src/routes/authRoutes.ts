import { Router } from 'express';
import {
  login,
  register,
  logout,
  getMe,
  forgotPassword,
  getDemoAccounts,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateLogin, validateRegister } from '../validators/authValidator.js';

const router = Router();

router.post('/login', authLimiter, validateLogin, login);
router.post('/register', authLimiter, validateRegister, register);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.post('/forgot-password', forgotPassword);
router.get('/demo-accounts', getDemoAccounts);

export default router;
