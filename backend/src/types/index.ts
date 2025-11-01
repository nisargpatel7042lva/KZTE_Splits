import { Request } from 'express'

// Extend Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    phone: string
    walletAddress: string
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Split calculation types
export interface SplitCalculation {
  userId: string
  amount: number
}

export interface DebtSimplification {
  from: string
  to: string
  amount: number
}

// OTP types
export interface OTPVerification {
  phone: string
  code: string
  expiresAt: Date
  attempts: number
  verified: boolean
}

// Blockchain types
export interface WalletInfo {
  publicKey: string
  encryptedPrivateKey: string
}

export interface TransactionInfo {
  signature: string
  status: 'pending' | 'confirmed' | 'failed'
  amount: number
  from?: string
  to?: string
}
