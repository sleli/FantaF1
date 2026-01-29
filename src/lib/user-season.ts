import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'
import { getActiveSeason } from './season'

export async function isUserEnabledForSeason(
  userId: string,
  seasonId?: string
): Promise<boolean> {
  let targetSeasonId = seasonId

  if (!targetSeasonId) {
    const activeSeason = await getActiveSeason()
    if (!activeSeason) return false
    targetSeasonId = activeSeason.id
  }

  const userSeason = await prisma.userSeason.findUnique({
    where: {
      userId_seasonId: {
        userId,
        seasonId: targetSeasonId
      }
    }
  })

  return userSeason?.isEnabled ?? false
}

export async function getUserSeasonStatus(userId: string, seasonId?: string) {
  let targetSeasonId = seasonId

  if (!targetSeasonId) {
    const activeSeason = await getActiveSeason()
    if (!activeSeason) {
      return { hasActiveSeason: false, isEnabled: false }
    }
    targetSeasonId = activeSeason.id
  }

  const userSeason = await prisma.userSeason.findUnique({
    where: {
      userId_seasonId: {
        userId,
        seasonId: targetSeasonId
      }
    }
  })

  return {
    hasActiveSeason: true,
    seasonId: targetSeasonId,
    isEnabled: userSeason?.isEnabled ?? false,
    userSeasonId: userSeason?.id
  }
}

export const getCachedUserSeasonStatus = unstable_cache(
  async (userId: string) => {
    return getUserSeasonStatus(userId)
  },
  ['user-season-status'],
  { revalidate: 300 } // 5 minuti
)

export async function setUserSeasonEnabled(
  userId: string,
  seasonId: string,
  isEnabled: boolean
) {
  return prisma.userSeason.upsert({
    where: {
      userId_seasonId: {
        userId,
        seasonId
      }
    },
    update: {
      isEnabled
    },
    create: {
      userId,
      seasonId,
      isEnabled
    }
  })
}

export async function getEnabledUsersForSeason(seasonId: string) {
  const userSeasons = await prisma.userSeason.findMany({
    where: {
      seasonId,
      isEnabled: true
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  })

  return userSeasons.map(us => us.user)
}

export async function getUserSeasonsForUser(userId: string) {
  return prisma.userSeason.findMany({
    where: { userId },
    include: {
      season: {
        select: {
          id: true,
          name: true,
          year: true,
          isActive: true
        }
      }
    },
    orderBy: {
      season: {
        startDate: 'desc'
      }
    }
  })
}
