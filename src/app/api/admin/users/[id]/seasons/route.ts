import { NextRequest } from 'next/server'
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/prisma'
import { setUserSeasonEnabled, getUserSeasonsForUser } from '@/lib/user-season'

async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userSeasons = await getUserSeasonsForUser(id)
    return apiResponse({ userSeasons })
  } catch (error) {
    console.error('Error fetching user seasons:', error)
    return apiResponse({ error: 'Errore nel recupero delle stagioni' }, 500)
  }
}

async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const body = await req.json()
    const { seasonId, isEnabled } = body

    if (!seasonId || typeof isEnabled !== 'boolean') {
      return apiResponse(
        { error: 'seasonId e isEnabled sono obbligatori' },
        400
      )
    }

    // Verifica che utente e stagione esistano
    const [user, season] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.season.findUnique({ where: { id: seasonId } })
    ])

    if (!user) {
      return apiResponse({ error: 'Utente non trovato' }, 404)
    }
    if (!season) {
      return apiResponse({ error: 'Stagione non trovata' }, 404)
    }

    const userSeason = await setUserSeasonEnabled(userId, seasonId, isEnabled)

    return apiResponse({ userSeason })
  } catch (error) {
    console.error('Error updating user season:', error)
    return apiResponse({ error: "Errore nell'aggiornamento" }, 500)
  }
}

export const GET = withAuthAPI(getHandler, { requiredRole: 'ADMIN' })
export const POST = withAuthAPI(postHandler, { requiredRole: 'ADMIN' })
