import { NextRequest } from 'next/server'
import { apiResponse } from '@/lib/auth/api-auth'
import { validateInvitationToken } from '@/lib/invitation'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return apiResponse({ error: 'Token mancante' }, 400)
    }

    const result = await validateInvitationToken(token)

    if (!result.valid) {
      return apiResponse({ valid: false, error: result.error }, 400)
    }

    return apiResponse({
      valid: true,
      user: result.user
    })
  } catch (error) {
    console.error('Error validating invitation:', error)
    return apiResponse({ error: 'Errore nella validazione' }, 500)
  }
}
