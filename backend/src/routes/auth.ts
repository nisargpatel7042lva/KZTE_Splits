import { Router } from 'express'
import {
  sendOtpHandler,
  verifyOtpHandler,
  setupProfileHandler,
  getMeHandler,
  refreshTokenHandler,
} from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'
import { authLimiter } from '../middleware/rateLimit'

const router = Router()

// Public routes (with rate limiting)
router.post('/send-otp', authLimiter, sendOtpHandler)
router.post('/verify-otp', authLimiter, verifyOtpHandler)
router.post('/refresh-token', authLimiter, refreshTokenHandler)

// Protected routes
router.post('/setup-profile', authenticateToken, setupProfileHandler)
router.get('/me', authenticateToken, getMeHandler)

export default router
