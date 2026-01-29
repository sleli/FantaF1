import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { createInvitedUser } from '@/lib/invitation';
import { getActiveSeason } from '@/lib/season';

// Admin-only API route to list all users
async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeEventOnly = searchParams.get('activeEvent') === 'true';

    const activeSeason = await getActiveSeason();

    let predictionWhere: any = undefined;

    if (activeEventOnly && activeSeason) {
      const activeEvent = await prisma.event.findFirst({
        where: {
          seasonId: activeSeason.id,
          status: { in: ['UPCOMING', 'CLOSED'] }
        },
        orderBy: { date: 'asc' }
      });

      if (activeEvent) {
        predictionWhere = { eventId: activeEvent.id };
      } else {
        predictionWhere = { eventId: 'cnone' };
      }
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        invitationStatus: true,
        invitedAt: true,
        createdAt: true,
        userSeasons: activeSeason
          ? {
              where: { seasonId: activeSeason.id },
              select: { isEnabled: true }
            }
          : false,
        _count: {
          select: {
            predictions: predictionWhere ? { where: predictionWhere } : true
          }
        }
      }
    });

    // Formatta risposta con isEnabledForSeason
    const formattedUsers = users.map((user) => ({
      ...user,
      isEnabledForSeason:
        user.userSeasons && user.userSeasons.length > 0
          ? user.userSeasons[0].isEnabled
          : false,
      userSeasons: undefined
    }));

    return apiResponse({ users: formattedUsers, activeSeasonId: activeSeason?.id });
  } catch (error) {
    console.error('Error fetching users:', error);
    return apiResponse({ error: 'Failed to fetch users' }, 500);
  }
}

// Admin-only API route to create a new user with invitation
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !name) {
      return apiResponse({ error: 'Email e nome sono obbligatori' }, 400);
    }

    const activeSeason = await getActiveSeason();
    if (!activeSeason) {
      return apiResponse({ error: 'Nessuna stagione attiva' }, 400);
    }

    const user = await createInvitedUser({
      email,
      name,
      seasonId: activeSeason.id,
      baseUrl: req.nextUrl.origin
    });

    return apiResponse({ user, message: 'Utente creato e invito inviato' }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    const message =
      error instanceof Error ? error.message : 'Errore nella creazione utente';
    return apiResponse({ error: message }, 400);
  }
}

export const GET = withAuthAPI(getHandler, { requiredRole: 'ADMIN' });
export const POST = withAuthAPI(postHandler, { requiredRole: 'ADMIN' });
