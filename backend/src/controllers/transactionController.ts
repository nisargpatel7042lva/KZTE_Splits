import { Response } from 'express'
import { AuthenticatedRequest } from '../types'
import { prisma } from '../lib/prisma'

/**
 * GET /api/transactions
 * List transactions with filtering
 */
export async function listTransactionsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const { type, status, limit = 20, offset = 0 } = req.query

    // Build where clause
    const where: any = {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.transaction.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          from: tx.fromUser,
          amount: tx.amount,
          status: tx.status,
          txHash: tx.txHash,
          createdAt: tx.createdAt,
          confirmedAt: tx.confirmedAt,
        })),
        total,
        hasMore: Number(offset) + transactions.length < total,
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * GET /api/transactions/recent
 * Get recent transactions
 */
export async function getRecentTransactionsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const { limit = 10 } = req.query

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(limit),
    })

    res.json({
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          from: tx.fromUser,
          amount: tx.amount,
          status: tx.status,
          txHash: tx.txHash,
          createdAt: tx.createdAt,
        })),
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * GET /api/transactions/:id
 * Get transaction details
 */
export async function getTransactionHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const transaction = await prisma.transaction.findUnique({
      where: { id },
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

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Transaction not found',
        },
      })
    }

    // Check if user is involved in transaction
    if (transaction.fromUserId !== userId && transaction.toUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have access to this transaction',
        },
      })
    }

    const blockchainLink = transaction.txHash
      ? `https://solscan.io/tx/${transaction.txHash}`
      : null

    res.json({
      success: true,
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          from: transaction.fromUser,
          amount: transaction.amount,
          status: transaction.status,
          txHash: transaction.txHash,
          splitId: transaction.splitId,
          metadata: transaction.metadata,
          createdAt: transaction.createdAt,
          confirmedAt: transaction.confirmedAt,
          blockchainLink,
        },
      },
    })
  } catch (error) {
    throw error
  }
}
