import { randomBytes } from 'crypto'
import { prisma } from './prisma'
import { sendInvitationEmail } from './email'
import { hash } from 'bcryptjs'

const INVITATION_EXPIRY_DAYS = 7

export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex')
}

interface CreateInvitedUserParams {
  email: string
  name: string
  seasonId: string
  baseUrl?: string
}

export async function createInvitedUser({
  email,
  name,
  seasonId,
  baseUrl
}: CreateInvitedUserParams) {
  const normalizedEmail = email.toLowerCase().trim()

  // Verifica se esiste già un utente con questa email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  })

  if (existingUser) {
    throw new Error('Un utente con questa email esiste già')
  }

  const token = generateInvitationToken()

  // Crea utente con invito pendente
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      invitationToken: token,
      invitedAt: new Date(),
      invitationStatus: 'PENDING',
      userSeasons: {
        create: {
          seasonId,
          isEnabled: true
        }
      }
    },
    include: {
      userSeasons: true
    }
  })

  // Invia email di invito
  await sendInvitationEmail({
    to: normalizedEmail,
    name,
    token,
    baseUrl
  })

  return user
}

interface ValidateTokenResult {
  valid: boolean
  user?: {
    id: string
    email: string | null
    name: string | null
    invitationStatus: string
  }
  error?: string
}

export async function validateInvitationToken(
  token: string
): Promise<ValidateTokenResult> {
  if (!token) {
    return { valid: false, error: 'Token mancante' }
  }

  const user = await prisma.user.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      email: true,
      name: true,
      invitedAt: true,
      invitationStatus: true
    }
  })

  if (!user) {
    return { valid: false, error: 'Token non valido' }
  }

  if (user.invitationStatus !== 'PENDING') {
    return { valid: false, error: 'Invito già utilizzato' }
  }

  // Verifica scadenza
  if (user.invitedAt) {
    const expiryDate = new Date(user.invitedAt)
    expiryDate.setDate(expiryDate.getDate() + INVITATION_EXPIRY_DAYS)

    if (new Date() > expiryDate) {
      return { valid: false, error: 'Invito scaduto' }
    }
  }

  return {
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      invitationStatus: user.invitationStatus
    }
  }
}

interface CompleteInvitationParams {
  token: string
  password: string
}

export async function completeInvitationWithPassword({
  token,
  password
}: CompleteInvitationParams) {
  const validation = await validateInvitationToken(token)

  if (!validation.valid || !validation.user) {
    throw new Error(validation.error || 'Token non valido')
  }

  const hashedPassword = await hash(password, 12)

  const user = await prisma.user.update({
    where: { id: validation.user.id },
    data: {
      password: hashedPassword,
      invitationToken: null,
      invitationStatus: 'ACCEPTED'
    }
  })

  return user
}

export async function markInvitationAccepted(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      invitationToken: null,
      invitationStatus: 'ACCEPTED'
    }
  })
}

export async function resendInvitation(userId: string, baseUrl?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      invitationStatus: true
    }
  })

  if (!user) {
    throw new Error('Utente non trovato')
  }

  if (!user.email) {
    throw new Error("L'utente non ha un'email")
  }

  if (user.invitationStatus === 'ACCEPTED') {
    throw new Error("L'utente ha già completato la registrazione")
  }

  const token = generateInvitationToken()

  await prisma.user.update({
    where: { id: userId },
    data: {
      invitationToken: token,
      invitedAt: new Date(),
      invitationStatus: 'PENDING'
    }
  })

  await sendInvitationEmail({
    to: user.email,
    name: user.name || '',
    token,
    baseUrl
  })

  return { success: true }
}
