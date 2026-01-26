import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { f1ImportService, F1APIError } from '@/lib/f1-api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST: Fetch results from OpenF1 using sessionKey (preview only)
 */
async function postHandler(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const eventId = params.id;

  // Get event with season drivers
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

  if (!event.sessionKey) {
    return apiResponse(
      { error: 'Questo evento non ha un session_key. Impossibile recuperare i risultati da OpenF1.' },
      400
    );
  }

  try {
    const apiResults = await f1ImportService.getEventResults(event.sessionKey);

    // Map driver numbers to internal driver IDs
    const seasonDrivers = event.season?.drivers || [];
    const driverMap = new Map(seasonDrivers.map(d => [d.number, d]));

    const mappedResults = apiResults.map(r => {
      const driver = driverMap.get(r.driverNumber);
      return {
        position: r.position,
        driverNumber: r.driverNumber,
        driverId: driver?.id || null,
        driverName: driver?.name || `Pilota sconosciuto (#${r.driverNumber})`,
        driverTeam: driver?.team || null
      };
    });

    const unmappedCount = mappedResults.filter(r => !r.driverId).length;

    return apiResponse({
      results: mappedResults,
      totalResults: mappedResults.length,
      unmappedDrivers: unmappedCount,
      eventName: event.name,
      sessionKey: event.sessionKey,
      message: unmappedCount > 0
        ? `Attenzione: ${unmappedCount} piloti non trovati nella stagione. Verifica i numeri dei piloti.`
        : 'Risultati recuperati con successo. Usa PUT per salvare.'
    });
  } catch (error) {
    console.error('Error fetching API results:', error);

    if (error instanceof F1APIError) {
      return apiResponse(
        { error: `Errore OpenF1: ${error.message}` },
        error.statusCode || 500
      );
    }

    return apiResponse(
      { error: 'Impossibile recuperare i risultati da OpenF1. Riprova più tardi.' },
      500
    );
  }
}

/**
 * PUT: Apply fetched results to event
 * Body: { results: [{ position: number, driverId: string }] }
 */
async function putHandler(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const eventId = params.id;

  let body;
  try {
    body = await req.json();
  } catch {
    return apiResponse({ error: 'Body JSON non valido' }, 400);
  }

  const { results } = body;

  if (!results || !Array.isArray(results)) {
    return apiResponse({ error: 'Array results richiesto' }, 400);
  }

  // Verify event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    return apiResponse({ error: 'Evento non trovato' }, 404);
  }

  // Transform results to driver IDs sorted by position
  const sortedResults = [...results].sort((a, b) => a.position - b.position);
  const driverIds = sortedResults
    .map(r => r.driverId)
    .filter(Boolean);

  // Build update data
  const updateData: any = {
    status: 'COMPLETED',
    results: driverIds,
    updatedAt: new Date()
  };

  // Also set legacy fields for compatibility
  if (driverIds.length > 0) updateData.firstPlaceId = driverIds[0];
  if (driverIds.length > 1) updateData.secondPlaceId = driverIds[1];
  if (driverIds.length > 2) updateData.thirdPlaceId = driverIds[2];

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true
      }
    });

    return apiResponse({
      event: updatedEvent,
      message: 'Risultati salvati con successo'
    });
  } catch (error) {
    console.error('Error saving results:', error);
    return apiResponse(
      { error: 'Errore nel salvataggio dei risultati' },
      500
    );
  }
}

export const POST = withAuthAPI(postHandler, { requiredRole: 'ADMIN' });
export const PUT = withAuthAPI(putHandler, { requiredRole: 'ADMIN' });
