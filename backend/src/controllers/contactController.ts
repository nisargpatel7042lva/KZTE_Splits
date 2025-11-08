import { Response } from 'express'
import { AuthenticatedRequest } from '../types'
import { prisma } from '../lib/prisma'

/**
 * GET /api/contacts
 * Get contacts list (users who have split with current user)
 */
export async function getContactsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user!.userId
    const { search, recent } = req.query

    // Get users who have been in splits with current user
    const splits = await prisma.split.findMany({
      where: {
        OR: [
          { paidBy: userId },
          { participants: { some: { userId } } },
        ],
      },
      include: {
        creator: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Collect unique users and their last split date
    const userMap = new Map<
      string,
      { user: any; lastSplitDate: Date }
    >()

    for (const split of splits) {
      // Add creator if not current user
      if (split.creator.id !== userId && !userMap.has(split.creator.id)) {
        userMap.set(split.creator.id, {
          user: split.creator,
          lastSplitDate: split.createdAt,
        })
      }

      // Add participants
      for (const participant of split.participants) {
        if (
          participant.user.id !== userId &&
          !userMap.has(participant.user.id)
        ) {
          userMap.set(participant.user.id, {
            user: participant.user,
            lastSplitDate: split.createdAt,
          })
        }
      }
    }

    let contacts = Array.from(userMap.values()).map((item) => ({
      userId: item.user.id,
      name: item.user.name,
      phone: item.user.phone,
      avatar: item.user.avatar,
      lastSplitDate: item.lastSplitDate,
    }))

    // Filter by search if provided
    if (search) {
      const searchLower = String(search).toLowerCase()
      contacts = contacts.filter(
        (contact) =>
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.phone.includes(searchLower)
      )
    }

    // If recent flag, only show recently split-with users (last 30 days)
    if (recent === 'true') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      contacts = contacts.filter(
        (contact) => contact.lastSplitDate >= thirtyDaysAgo
      )
    }

    // Sort by last split date
    contacts.sort(
      (a, b) => b.lastSplitDate.getTime() - a.lastSplitDate.getTime()
    )

    res.json({
      success: true,
      data: {
        contacts,
      },
    })
  } catch (error) {
    throw error
  }
}


