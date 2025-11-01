import { Response } from 'express'
import { z } from 'zod'
import { AuthenticatedRequest } from '../types'
import { prisma } from '../lib/prisma'
import { calculateGroupBalances, GroupSplit } from '../services/splitCalculation'

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  memberIds: z.array(z.string()).min(1).max(50),
})

const addMemberSchema = z.object({
  userId: z.string(),
})

/**
 * GET /api/groups
 * List user's groups
 */
export async function listGroupsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
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
        splits: {
          where: {
            status: 'PENDING',
          },
          include: {
            participants: {
              where: {
                userId,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Calculate balance for each group
    const groupsWithBalance = groups.map((group) => {
      // Calculate user's balance in this group
      let balance = 0

      for (const split of group.splits) {
        if (split.paidBy === userId) {
          // User paid, they are owed
          const unpaidAmount = split.participants
            .filter((p) => !p.paid)
            .reduce((sum, p) => sum + Number(p.amount), 0)
          balance += unpaidAmount
        } else {
          // User owes
          const userParticipant = split.participants.find((p) => p.userId === userId)
          if (userParticipant && !userParticipant.paid) {
            balance -= Number(userParticipant.amount)
          }
        }
      }

      return {
        id: group.id,
        name: group.name,
        avatar: group.avatar,
        memberCount: group.members.length,
        balance,
        lastActivity: group.updatedAt,
        role: group.members.find((m) => m.userId === userId)?.role || 'MEMBER',
      }
    })

    res.json({
      success: true,
      data: {
        groups: groupsWithBalance,
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * POST /api/groups/create
 * Create a new group
 */
export async function createGroupHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const { name, memberIds } = createGroupSchema.parse(req.body)

    // Create group with creator as admin
    const group = await prisma.group.create({
      data: {
        name,
        createdBy: userId,
        members: {
          create: [
            {
              userId,
              role: 'ADMIN',
            },
            ...memberIds.map((memberId) => ({
              userId: memberId,
              role: 'MEMBER' as const,
            })),
          ],
        },
      },
      include: {
        members: {
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
      },
    })

    // Create notifications for added members
    await Promise.all(
      memberIds.map((memberId) =>
        prisma.notification.create({
          data: {
            userId: memberId,
            type: 'GROUP_INVITE',
            title: 'Added to group',
            message: `You were added to ${name}`,
            metadata: {
              groupId: group.id,
            },
          },
        })
      )
    )

    res.status(201).json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          avatar: group.avatar,
          createdBy: group.createdBy,
          members: group.members.map((m) => ({
            userId: m.user.id,
            name: m.user.name,
            avatar: m.user.avatar,
            role: m.role,
            joinedAt: m.joinedAt,
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
 * GET /api/groups/:id
 * Get group details
 */
export async function getGroupHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
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
        splits: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
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
          },
        },
      },
    })

    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Group not found',
        },
      })
    }

    // Check if user is member
    const isMember = group.members.some((m) => m.userId === userId)

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You are not a member of this group',
        },
      })
    }

    res.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          avatar: group.avatar,
          createdBy: group.createdBy,
          members: group.members.map((m) => ({
            userId: m.user.id,
            name: m.user.name,
            avatar: m.user.avatar,
            role: m.role,
            joinedAt: m.joinedAt,
          })),
          recentSplits: group.splits,
        },
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * POST /api/groups/:id/members
 * Add member to group (admin only)
 */
export async function addGroupMemberHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const { userId: newMemberId } = addMemberSchema.parse(req.body)

    // Check if user is admin
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId,
        role: 'ADMIN',
      },
    })

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only group admins can add members',
        },
      })
    }

    // Check if member already exists
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: newMemberId,
      },
    })

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_MEMBER',
          message: 'User is already a member of this group',
        },
      })
    }

    // Add member
    const newMember = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: newMemberId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: newMemberId,
        type: 'GROUP_INVITE',
        title: 'Added to group',
        message: 'You were added to a group',
        metadata: {
          groupId: id,
        },
      },
    })

    res.json({
      success: true,
      data: {
        member: {
          userId: newMember.user.id,
          name: newMember.user.name,
          avatar: newMember.user.avatar,
          role: newMember.role,
        },
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid user ID',
        },
      })
    }
    throw error
  }
}

/**
 * DELETE /api/groups/:id/members/:userId
 * Remove member from group (admin only or self)
 */
export async function removeGroupMemberHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id, userId: targetUserId } = req.params
    const userId = req.user!.userId

    // Check if removing self or need admin permission
    if (targetUserId !== userId) {
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: id,
          userId,
          role: 'ADMIN',
        },
      })

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Only group admins can remove members',
          },
        })
      }
    }

    // Remove member
    await prisma.groupMember.deleteMany({
      where: {
        groupId: id,
        userId: targetUserId,
      },
    })

    res.json({
      success: true,
    })
  } catch (error) {
    throw error
  }
}

/**
 * GET /api/groups/:id/balances
 * Get simplified balances for group settlement
 */
export async function getGroupBalancesHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    // Check if user is member
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId,
      },
    })

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You are not a member of this group',
        },
      })
    }

    // Get all group splits
    const splits = await prisma.split.findMany({
      where: {
        groupId: id,
        status: 'PENDING',
      },
      include: {
        participants: true,
      },
    })

    // Convert to GroupSplit format
    const groupSplits: GroupSplit[] = splits.map((split) => ({
      paidBy: split.paidBy,
      participants: split.participants.map((p) => ({
        userId: p.userId,
        amount: Number(p.amount),
      })),
    }))

    // Calculate balances and simplify
    const { balances, simplifiedTransactions } = calculateGroupBalances(groupSplits)

    // Get user names for balances
    const userIds = Object.keys(balances)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    res.json({
      success: true,
      data: {
        balances: Object.entries(balances).map(([userId, balance]) => ({
          userId,
          name: userMap.get(userId)?.name,
          avatar: userMap.get(userId)?.avatar,
          netBalance: balance,
        })),
        simplifiedTransactions: simplifiedTransactions.map((tx) => ({
          from: {
            userId: tx.from,
            name: userMap.get(tx.from)?.name,
            avatar: userMap.get(tx.from)?.avatar,
          },
          to: {
            userId: tx.to,
            name: userMap.get(tx.to)?.name,
            avatar: userMap.get(tx.to)?.avatar,
          },
          amount: tx.amount,
        })),
      },
    })
  } catch (error) {
    throw error
  }
}
