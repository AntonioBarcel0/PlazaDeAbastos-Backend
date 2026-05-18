import express from 'express';
import { register, login, getProfile, updateProfile, verifyEmail, resendVerification, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;