import { NextRequest } from 'next/server'
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth'
import { resendInvitation } from '@/lib/invitation'

async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await resendInvitation(id, req.nextUrl.origin)
    return apiResponse({ message: 'Invito reinviato con successo' })
  } catch (error) {
    console.error('Error resending invitation:', error)
    const message =
      error instanceof Error ? error.message : "Errore nell'invio dell'invito"
    return apiResponse({ error: message }, 400)
  }
}

export const POST = withAuthAPI(postHandler, { requiredRole: 'ADMIN' })
