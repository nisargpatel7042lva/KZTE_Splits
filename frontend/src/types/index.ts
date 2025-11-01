// User types
export interface User {
  id: string
  phone: string
  name: string | null
  avatar: string | null
  walletAddress: string
  createdAt: string
}

// Auth types
export interface LoginResponse {
  success: boolean
  data: {
    isNewUser: boolean
    requiresProfileSetup: boolean
    accessToken: string
    refreshToken: string
    user: User
  }
}

// Split types
export type SplitType = 'EQUAL' | 'CUSTOM' | 'PERCENTAGE' | 'EXACT'
export type SplitStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export interface SplitParticipant {
  userId: string
  name: string | null
  avatar: string | null
  amount: number
  paid: boolean
  paidAt?: string
  txHash?: string
}

export interface Split {
  id: string
  amount: number
  description: string | null
  splitType: SplitType
  paidBy: User
  group?: Group
  status: SplitStatus
  txHash?: string
  createdAt: string
  participants: SplitParticipant[]
}

// Group types
export type GroupRole = 'ADMIN' | 'MEMBER'

export interface GroupMember {
  userId: string
  name: string | null
  avatar: string | null
  role: GroupRole
  joinedAt: string
}

export interface Group {
  id: string
  name: string
  avatar: string | null
  memberCount: number
  balance: number
  lastActivity: string
  role: GroupRole
  members?: GroupMember[]
  recentSplits?: Split[]
}

// Transaction types
export type TransactionType = 'SPLIT_PAYMENT' | 'ADD_FUNDS' | 'CASH_OUT' | 'TRANSFER'
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'

export interface Transaction {
  id: string
  type: TransactionType
  from?: User
  amount: number
  status: TransactionStatus
  txHash?: string
  createdAt: string
  confirmedAt?: string
  blockchainLink?: string
}

// Wallet types
export interface WalletBalance {
  balance: number
  walletAddress: string
  lastUpdated: string
}

export interface BalanceSummary {
  youOwe: {
    total: number
    count: number
  }
  youAreOwed: {
    total: number
    count: number
  }
}

// Contact types
export interface Contact {
  userId: string
  name: string | null
  phone: string
  avatar: string | null
  lastSplitDate: string
}

// Notification types
export type NotificationType = 'SPLIT_REQUEST' | 'SPLIT_PAID' | 'GROUP_INVITE' | 'PAYMENT_RECEIVED'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  metadata?: any
  createdAt: string
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

// Split creation draft types
export interface SplitDraft {
  amount: number
  description: string
  selectedContacts: string[]
  splitType: SplitType
  customAmounts?: Record<string, number>
  percentages?: Record<string, number>
  contributions?: Record<string, number>
  includeSelf: boolean
  paidBy?: string
  groupId?: string
  note?: string
}

// Form types
export interface CreateSplitRequest {
  amount: number
  description?: string
  splitType: SplitType
  participants: Array<{
    userId: string
    amount?: number
  }>
  groupId?: string
  note?: string
}
