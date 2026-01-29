import { NextRequest } from 'next/server'
import { apiResponse } from '@/lib/auth/api-auth'
import { completeInvitationWithPassword } from '@/lib/invitation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return apiResponse({ error: 'Token e password sono obbligatori' }, 400)
    }

    if (password.length < 8) {
      return apiResponse(
        { error: 'La password deve avere almeno 8 caratteri' },
        400
      )
    }

    const user = await completeInvitationWithPassword({ token, password })

    return apiResponse({
      success: true,
      message: 'Registrazione completata. Ora puoi accedere.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Error completing invitation:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Errore nel completamento della registrazione'
    return apiResponse({ error: message }, 400)
  }
}
