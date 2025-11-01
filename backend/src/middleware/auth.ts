import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { verifyAccessToken } from '../services/jwt'

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Access token is required',
        },
      })
    }

    // Verify token
    const payload = verifyAccessToken(token)

    // Attach user data to request
    req.user = {
      userId: payload.userId,
      phone: payload.phone,
      walletAddress: payload.walletAddress,
    }

    next()
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_INVALID_TOKEN',
        message: error.message || 'Invalid or expired access token',
      },
    })
  }
}

/**
 * Optional authentication middleware
 * Attaches user data if token is valid, but doesn't block request
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const payload = verifyAccessToken(token)
      req.user = {
        userId: payload.userId,
        phone: payload.phone,
        walletAddress: payload.walletAddress,
      }
    }

    next()
  } catch (error) {
    // Silently fail - user is not authenticated
    next()
  }
}
