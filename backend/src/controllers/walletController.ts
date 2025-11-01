import { Response } from 'express'
import { AuthenticatedRequest } from '../types'
import { prisma } from '../lib/prisma'
import { getBalance, getTransactionHistory } from '../services/blockchain'

/**
 * GET /api/wallet/balance
 * Get current KZTE balance
 */
export async function getBalanceHandler(
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

    // Get balance from blockchain
    const balance = await getBalance(user.walletAddress)

    res.json({
      success: true,
      data: {
        balance,
        walletAddress: user.walletAddress,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error getting balance:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'BLOCKCHAIN_ERROR',
        message: 'Failed to fetch wallet balance',
      },
    })
  }
}

/**
 * GET /api/wallet/summary
 * Get balance summary (owed/owing)
 */
export async function getBalanceSummaryHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId

    // Calculate amounts you owe (unpaid splits you're a participant in)
    const youOwe = await prisma.splitParticipant.aggregate({
      where: {
        userId,
        paid: false,
        split: {
          status: 'PENDING',
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Calculate amounts you are owed (unpaid splits you created)
    const youAreOwed = await prisma.splitParticipant.aggregate({
      where: {
        paid: false,
        split: {
          paidBy: userId,
          status: 'PENDING',
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    res.json({
      success: true,
      data: {
        youOwe: {
          total: Number(youOwe._sum.amount || 0),
          count: youOwe._count,
        },
        youAreOwed: {
          total: Number(youAreOwed._sum.amount || 0),
          count: youAreOwed._count,
        },
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * GET /api/wallet/address
 * Get wallet address and QR code data
 */
export async function getWalletAddressHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true,
      },
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
        walletAddress: user.walletAddress,
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * GET /api/wallet/transactions
 * Get wallet transaction history
 */
export async function getWalletTransactionsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const { limit = 10 } = req.query

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

    // Get transactions from blockchain
    const blockchainTxs = await getTransactionHistory(
      user.walletAddress,
      Number(limit)
    )

    // Get transactions from database for additional context
    const dbTransactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(limit),
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: {
        transactions: dbTransactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          from: tx.fromUser,
          amount: tx.amount,
          status: tx.status,
          txHash: tx.txHash,
          createdAt: tx.createdAt,
          confirmedAt: tx.confirmedAt,
        })),
      },
    })
  } catch (error: any) {
    console.error('Error getting transactions:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'BLOCKCHAIN_ERROR',
        message: 'Failed to fetch transaction history',
      },
    })
  }
}

/**
 * POST /api/wallet/add-funds
 * Initiate add funds process (mock for demo)
 */
export async function addFundsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid amount',
        },
      })
    }

    // Create transaction record (pending)
    const transaction = await prisma.transaction.create({
      data: {
        toUserId: userId,
        amount,
        type: 'ADD_FUNDS',
        status: 'PENDING',
        metadata: {
          method: 'bank_transfer',
        },
      },
    })

    res.json({
      success: true,
      data: {
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          instructions:
            'This is a demo. In production, this would provide bank transfer instructions.',
        },
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * POST /api/wallet/cash-out
 * Cash out KZTE to bank account (mock for demo)
 */
export async function cashOutHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const { amount, bankAccountId } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid amount',
        },
      })
    }

    // Check balance
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

    const balance = await getBalance(user.walletAddress)

    if (balance < amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient KZTE balance',
        },
      })
    }

    // Create transaction record (pending)
    const transaction = await prisma.transaction.create({
      data: {
        fromUserId: userId,
        amount,
        type: 'CASH_OUT',
        status: 'PENDING',
        metadata: {
          bankAccountId,
        },
      },
    })

    res.json({
      success: true,
      data: {
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    })
  } catch (error: any) {
    console.error('Error cashing out:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'TRANSACTION_FAILED',
        message: error.message || 'Failed to process cash out',
      },
    })
  }
}
