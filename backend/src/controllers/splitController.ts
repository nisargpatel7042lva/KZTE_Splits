import { Response } from 'express'
import { z } from 'zod'
import { AuthenticatedRequest } from '../types'
import { prisma } from '../lib/prisma'
import {
  calculateEqualSplit,
  calculateCustomSplit,
  calculatePercentageSplit,
  calculateExactShares,
} from '../services/splitCalculation'
import { transferKZTE, getBalance } from '../services/blockchain'
import { SplitType, SplitStatus } from '@prisma/client'

// Validation schemas
const createSplitSchema = z.object({
  amount: z.number().min(10).max(1000000),
  description: z.string().max(200).optional(),
  splitType: z.enum(['EQUAL', 'CUSTOM', 'PERCENTAGE', 'EXACT']),
  participants: z.array(
    z.object({
      userId: z.string(),
      amount: z.number().optional(),
    })
  ).min(1).max(50),
  groupId: z.string().optional(),
  note: z.string().max(500).optional(),
})

/**
 * POST /api/splits/create
 * Create a new split
 */
export async function createSplitHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const body = createSplitSchema.parse(req.body)

    // Calculate participant amounts based on split type
    let participantCalculations

    switch (body.splitType) {
      case 'EQUAL':
        participantCalculations = calculateEqualSplit(
          body.amount,
          body.participants.map((p) => p.userId)
        )
        break
      case 'CUSTOM':
        const customAmounts: Record<string, number> = {}
        for (const p of body.participants) {
          if (!p.amount) {
            throw new Error('Custom split requires amount for each participant')
          }
          customAmounts[p.userId] = p.amount
        }
        participantCalculations = calculateCustomSplit(body.amount, customAmounts)
        break
      case 'PERCENTAGE':
        const percentages: Record<string, number> = {}
        for (const p of body.participants) {
          if (!p.amount) {
            throw new Error('Percentage split requires percentage for each participant')
          }
          percentages[p.userId] = p.amount // amount field contains percentage
        }
        participantCalculations = calculatePercentageSplit(body.amount, percentages)
        break
      case 'EXACT':
        const contributions: Record<string, number> = {}
        for (const p of body.participants) {
          contributions[p.userId] = p.amount || 0
        }
        const exactCalculations = calculateExactShares(
          body.amount,
          contributions,
          body.participants.map((p) => p.userId)
        )
        // Convert exact shares to participant format
        participantCalculations = exactCalculations.map((calc) => ({
          userId: calc.from,
          amount: calc.amount,
        }))
        break
      default:
        throw new Error('Invalid split type')
    }

    // Create split in database
    const split = await prisma.split.create({
      data: {
        amount: body.amount,
        description: body.description,
        splitType: body.splitType as SplitType,
        paidBy: userId,
        groupId: body.groupId,
        status: SplitStatus.PENDING,
        participants: {
          create: participantCalculations.map((calc) => ({
            userId: calc.userId,
            amount: calc.amount,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Create notifications for participants
    await Promise.all(
      split.participants.map((participant) =>
        prisma.notification.create({
          data: {
            userId: participant.userId,
            type: 'SPLIT_REQUEST',
            title: `Split request from ${split.creator.name || split.creator.phone}`,
            message: `You owe ${participant.amount} KZTE for ${split.description || 'a split'}`,
            metadata: {
              splitId: split.id,
            },
          },
        })
      )
    )

    res.status(201).json({
      success: true,
      data: {
        split: {
          id: split.id,
          amount: split.amount,
          description: split.description,
          splitType: split.splitType,
          paidBy: split.creator,
          group: split.group,
          status: split.status,
          createdAt: split.createdAt,
          participants: split.participants.map((p) => ({
            userId: p.user.id,
            name: p.user.name,
            avatar: p.user.avatar,
            amount: p.amount,
            paid: p.paid,
          })),
        },
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: error.errors[0]?.message || 'Invalid request data',
        },
      })
    }
    throw error
  }
}

/**
 * GET /api/splits/:id
 * Get split details
 */
export async function getSplitHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const split = await prisma.split.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    if (!split) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Split not found',
        },
      })
    }

    // Check if user is involved in split
    const isParticipant = split.participants.some((p) => p.userId === userId)
    const isCreator = split.paidBy === userId

    if (!isParticipant && !isCreator) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have access to this split',
        },
      })
    }

    res.json({
      success: true,
      data: {
        split: {
          id: split.id,
          amount: split.amount,
          description: split.description,
          splitType: split.splitType,
          paidBy: split.creator,
          group: split.group,
          status: split.status,
          txHash: split.txHash,
          createdAt: split.createdAt,
          participants: split.participants.map((p) => ({
            userId: p.user.id,
            name: p.user.name,
            avatar: p.user.avatar,
            amount: p.amount,
            paid: p.paid,
            paidAt: p.paidAt,
            txHash: p.txHash,
          })),
        },
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * GET /api/splits
 * List user's splits
 */
export async function listSplitsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const { status, type, limit = 20, offset = 0 } = req.query

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (type === 'sent') {
      where.paidBy = userId
    } else if (type === 'received') {
      where.participants = {
        some: {
          userId,
        },
      }
    } else {
      // All splits (sent or received)
      where.OR = [
        { paidBy: userId },
        { participants: { some: { userId } } },
      ]
    }

    const [splits, total] = await Promise.all([
      prisma.split.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.split.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        splits,
        total,
        hasMore: Number(offset) + splits.length < total,
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * POST /api/splits/:id/pay
 * Pay a split participant amount
 */
export async function paySplitHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    // Find split and participant
    const split = await prisma.split.findUnique({
      where: { id },
      include: {
        creator: true,
        participants: {
          where: { userId },
        },
      },
    })

    if (!split) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Split not found',
        },
      })
    }

    const participant = split.participants[0]

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'You are not a participant in this split',
        },
      })
    }

    if (participant.paid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_PAID',
          message: 'This split has already been paid',
        },
      })
    }

    // Get user's encrypted private key
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

    // Check balance
    const balance = await getBalance(user.walletAddress)
    if (balance < Number(participant.amount)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient KZTE balance',
        },
      })
    }

    // Transfer KZTE tokens
    const transaction = await transferKZTE(
      user.privateKey,
      split.creator.walletAddress,
      Number(participant.amount)
    )

    // Update participant as paid
    await prisma.splitParticipant.update({
      where: { id: participant.id },
      data: {
        paid: true,
        paidAt: new Date(),
        txHash: transaction.signature,
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        fromUserId: userId,
        toUserId: split.paidBy,
        amount: participant.amount,
        type: 'SPLIT_PAYMENT',
        status: 'CONFIRMED',
        txHash: transaction.signature,
        splitId: split.id,
      },
    })

    // Check if all participants paid
    const allParticipants = await prisma.splitParticipant.findMany({
      where: { splitId: split.id },
    })

    const allPaid = allParticipants.every((p) => p.paid)

    if (allPaid) {
      await prisma.split.update({
        where: { id: split.id },
        data: { status: SplitStatus.COMPLETED },
      })
    }

    // Create notification for split creator
    await prisma.notification.create({
      data: {
        userId: split.paidBy,
        type: 'SPLIT_PAID',
        title: `${user.name || user.phone} paid you`,
        message: `You received ${participant.amount} KZTE for ${split.description || 'a split'}`,
        metadata: {
          splitId: split.id,
        },
      },
    })

    res.json({
      success: true,
      data: {
        transaction: {
          id: transaction.signature,
          txHash: transaction.signature,
          status: transaction.status,
          amount: participant.amount,
        },
      },
    })
  } catch (error: any) {
    console.error('Error paying split:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'TRANSACTION_FAILED',
        message: error.message || 'Failed to process payment',
      },
    })
  }
}

/**
 * PUT /api/splits/:id/cancel
 * Cancel a split (only by creator, only if no payments made)
 */
export async function cancelSplitHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const split = await prisma.split.findUnique({
      where: { id },
      include: {
        participants: true,
      },
    })

    if (!split) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Split not found',
        },
      })
    }

    // Check if user is creator
    if (split.paidBy !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only the split creator can cancel it',
        },
      })
    }

    // Check if any payments made
    const anyPaid = split.participants.some((p) => p.paid)

    if (anyPaid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Cannot cancel split - some participants have already paid',
        },
      })
    }

    // Cancel split
    await prisma.split.update({
      where: { id },
      data: { status: SplitStatus.CANCELLED },
    })

    res.json({
      success: true,
      data: {
        split: {
          id: split.id,
          status: 'CANCELLED',
        },
      },
    })
  } catch (error) {
    throw error
  }
}
