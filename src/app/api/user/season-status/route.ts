import { NextRequest } from 'next/server'
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth'
import { getToken } from 'next-auth/jwt'
import { getUserSeasonStatus } from '@/lib/user-season'

async function getHandler(req: NextRequest) {
  try {
    const token = await getToken({ req })

    if (!token?.userId) {
      return apiResponse({ error: 'Utente non trovato' }, 400)
    }

    const status = await getUserSeasonStatus(token.userId as string)

    return apiResponse(status)
  } catch (error) {
    console.error('Error fetching season status:', error)
    return apiResponse({ error: 'Errore nel recupero dello stato' }, 500)
  }
}

export const GET = withAuthAPI(getHandler)
