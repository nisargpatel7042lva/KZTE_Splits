import { Response } from 'express'
import { z } from 'zod'
import { AuthenticatedRequest } from '../types'
import { prisma } from '../lib/prisma'
import { generateOTP, sendOTP, validatePhoneNumber } from '../services/sms'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/jwt'
import { createWallet } from '../services/blockchain'

// Validation schemas
const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/, 'Invalid Kazakhstan phone number format'),
})

const verifyOtpSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, 'OTP must be 6 digits'),
})

const setupProfileSchema = z.object({
  name: z.string().min(2).max(50).trim(),
})

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
})

/**
 * POST /api/auth/send-otp
 * Send OTP code to phone number
 */
export async function sendOtpHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { phone } = sendOtpSchema.parse(req.body)

    // Check rate limiting (max 3 OTP requests per hour per phone)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRequests = await prisma.otpVerification.count({
      where: {
        phone,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    })

    if (recentRequests >= 3) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AUTH_RATE_LIMIT',
          message: 'Too many OTP requests. Please try again in an hour.',
        },
      })
    }

    // Generate OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    })

    // Send OTP via SMS
    const sent = await sendOTP(phone, code)

    if (!sent) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SMS_SEND_FAILED',
          message: 'Failed to send OTP. Please try again.',
        },
      })
    }

    res.json({
      success: true,
      data: {
        message: 'OTP sent successfully',
        expiresIn: 600, // seconds
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: error.errors[0]?.message || 'Invalid phone number',
        },
      })
    }
    throw error
  }
}

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and login/register user
 */
export async function verifyOtpHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { phone, code } = verifyOtpSchema.parse(req.body)

    // Find OTP verification
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone,
        code,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_OTP_INVALID',
          message: 'Invalid OTP code',
        },
      })
    }

    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_OTP_EXPIRED',
          message: 'OTP code has expired',
        },
      })
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AUTH_TOO_MANY_ATTEMPTS',
          message: 'Too many failed attempts. Please request a new OTP.',
        },
      })
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    })

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
    })

    let isNewUser = false

    if (!user) {
      // Create new user with Solana wallet
      const wallet = createWallet()
      user = await prisma.user.create({
        data: {
          phone,
          walletAddress: wallet.publicKey,
          privateKey: wallet.encryptedPrivateKey,
        },
      })
      isNewUser = true
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      phone: user.phone,
      walletAddress: user.walletAddress,
    })
    const refreshToken = await generateRefreshToken(user.id)

    res.json({
      success: true,
      data: {
        isNewUser,
        requiresProfileSetup: !user.name,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          walletAddress: user.walletAddress,
        },
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid request data',
        },
      })
    }
    throw error
  }
}

/**
 * POST /api/auth/setup-profile
 * Set up user profile (name, optional avatar)
 */
export async function setupProfileHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { name } = setupProfileSchema.parse(req.body)
    const userId = req.user!.userId

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
    })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          walletAddress: user.walletAddress,
        },
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: error.errors[0]?.message || 'Invalid name',
        },
      })
    }
    throw error
  }
}

/**
 * GET /api/auth/me
 * Get current user profile
 */
export async function getMeHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          walletAddress: user.walletAddress,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
export async function refreshTokenHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body)

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken)

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      })
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      phone: user.phone,
      walletAddress: user.walletAddress,
    })
    const newRefreshToken = await generateRefreshToken(user.id)

    // Delete old refresh token
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    })

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    })
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_INVALID_TOKEN',
        message: error.message || 'Invalid or expired refresh token',
      },
    })
  }
}
