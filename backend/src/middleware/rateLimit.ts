import rateLimit from 'express-rate-limit'
import { config } from '../config'

/**
 * General API rate limiter
 * 100 requests per minute per user
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Authentication rate limiter
 * 10 requests per minute per IP
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in a minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Wallet operation rate limiter
 * 30 requests per minute per user
 */
export const walletLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many wallet operations. Please try again in a minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})
