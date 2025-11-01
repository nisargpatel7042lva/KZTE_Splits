import jwt from 'jsonwebtoken'
import { config } from '../config'
import { prisma } from '../lib/prisma'

interface AccessTokenPayload {
  userId: string
  phone: string
  walletAddress: string
}

interface RefreshTokenPayload {
  userId: string
  tokenId: string
}

/**
 * Generate access token (short-lived, 15 minutes)
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry,
  })
}

/**
 * Generate refresh token (long-lived, 7 days)
 * Also stores in database for revocation capability
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const tokenId = Math.random().toString(36).substring(7)

  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
  }

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiry,
  })

  // Store refresh token in database
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as AccessTokenPayload
  } catch (error) {
    throw new Error('Invalid or expired access token')
  }
}

/**
 * Verify refresh token and check if it exists in database
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as RefreshTokenPayload

    // Check if token exists in database and hasn't been revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    })

    if (!storedToken) {
      throw new Error('Refresh token has been revoked')
    }

    if (storedToken.expiresAt < new Date()) {
      // Token expired, delete it
      await prisma.refreshToken.delete({
        where: { token },
      })
      throw new Error('Refresh token has expired')
    }

    return payload
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

/**
 * Revoke refresh token (logout)
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token },
  })
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  })
}
