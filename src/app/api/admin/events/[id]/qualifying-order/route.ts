import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { openF1Client, F1APIError } from '@/lib/f1-api/openf1';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handler(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const eventId = params.id;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      season: {
        include: {
          drivers: {
            where: { active: true }
          }
        }
      }
    }
  });

  if (!event) {
    return apiResponse({ error: 'Evento non trovato' }, 404);
  }

  if (!event.meetingKey) {
    return apiResponse(
      { error: 'Questo evento non ha un meeting_key. Impossibile recuperare i risultati delle qualifiche.' },
      400
    );
  }

  try {
    const sessions = await openF1Client.getSessions(event.meetingKey);

    // Find the qualifying session based on event type
    let qualifyingSession;
    if (event.type === 'SPRINT') {
      qualifyingSession = sessions.find(
        s => s.session_name === 'Sprint Qualifying' || s.session_name === 'Sprint Shootout'
      );
    } else {
      qualifyingSession = sessions.find(s => s.session_name === 'Qualifying');
    }

    if (!qualifyingSession) {
      return apiResponse(
        { error: 'Sessione di qualifica non trovata. Potrebbe non essere ancora stata disputata.' },
        404
      );
    }

    const results = await openF1Client.getFinalResults(qualifyingSession.session_key);

    // Map driver_number → driver.id
    const seasonDrivers = event.season?.drivers || [];
    const driverMap = new Map(seasonDrivers.map(d => [d.number, d.id]));

    const orderedDriverIds: string[] = [];
    const mappedNumbers = new Set<number>();

    for (const result of results) {
      const driverId = driverMap.get(result.driver_number);
      if (driverId) {
        orderedDriverIds.push(driverId);
        mappedNumbers.add(result.driver_number);
      }
    }

    // Append active drivers not present in qualifying results
    for (const driver of seasonDrivers) {
      if (!mappedNumbers.has(driver.number)) {
        orderedDriverIds.push(driver.id);
      }
    }

    return apiResponse({ orderedDriverIds });
  } catch (error) {
    console.error('Error fetching qualifying order:', error);

    if (error instanceof F1APIError) {
      return apiResponse(
        { error: `Errore OpenF1: ${error.message}` },
        error.statusCode || 500
      );
    }

    return apiResponse(
      { error: 'Impossibile recuperare i risultati delle qualifiche. Riprova più tardi.' },
      500
    );
  }
}

export const GET = withAuthAPI(handler, { requiredRole: 'ADMIN' });
