import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { ScoringType } from '@prisma/client';
import { f1ImportService, F1APIError } from '@/lib/f1-api';

// GET: List all seasons
async function getHandler(req: NextRequest) {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: {
        startDate: 'desc'
      },
      include: {
        _count: {
          select: { events: true }
        }
      }
    });
    return apiResponse({ seasons });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return apiResponse({ error: 'Failed to fetch seasons' }, 500);
  }
}

// POST: Create new season (Admin only)
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      startDate,
      endDate,
      scoringType,
      copyDriversFromSeasonId,
      // New F1 import fields
      year,
      importDriversFromF1,
      importEventsFromF1
    } = body;

    // Basic validation
    if (!name || !startDate || !endDate) {
      return apiResponse({ error: 'Campi obbligatori mancanti' }, 400);
    }

    // Check unique name
    const existing = await prisma.season.findUnique({
      where: { name }
    });

    if (existing) {
      return apiResponse({ error: 'Nome stagione già esistente' }, 409);
    }

    // Validate year if F1 import is requested
    const parsedYear = year ? parseInt(year) : null;
    if ((importDriversFromF1 || importEventsFromF1) && (!parsedYear || parsedYear < 2023 || parsedYear > 2030)) {
      return apiResponse({ error: 'Anno non valido per import F1' }, 400);
    }

    // Fetch F1 data before transaction if needed
    let f1Drivers: Awaited<ReturnType<typeof f1ImportService.importDriversWithFallback>> = [];
    let f1Events: Awaited<ReturnType<typeof f1ImportService.importEventsForYear>> = [];

    if (importDriversFromF1 && parsedYear) {
      try {
        f1Drivers = await f1ImportService.importDriversWithFallback(parsedYear);
      } catch (error) {
        console.error('Error fetching F1 drivers:', error);
        if (error instanceof F1APIError) {
          return apiResponse({ error: `Errore import piloti: ${error.message}` }, 500);
        }
        return apiResponse({ error: 'Impossibile importare i piloti F1' }, 500);
      }
    }

    if (importEventsFromF1 && parsedYear) {
      try {
        f1Events = await f1ImportService.importEventsForYear(parsedYear);
      } catch (error) {
        console.error('Error fetching F1 events:', error);
        if (error instanceof F1APIError) {
          return apiResponse({ error: `Errore import eventi: ${error.message}` }, 500);
        }
        return apiResponse({ error: 'Impossibile importare gli eventi F1' }, 500);
      }
    }

    // Use transaction to create season, drivers and events
    const result = await prisma.$transaction(async (tx) => {
      const newSeason = await tx.season.create({
        data: {
          name,
          year: parsedYear,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          scoringType: scoringType as ScoringType || 'LEGACY_TOP3',
          isActive: false
        }
      });

      let driversCreated = 0;
      let eventsCreated = 0;

      // Copy drivers from another season
      if (copyDriversFromSeasonId && !importDriversFromF1) {
        const sourceDrivers = await tx.driver.findMany({
          where: { seasonId: copyDriversFromSeasonId }
        });

        if (sourceDrivers.length > 0) {
          await tx.driver.createMany({
            data: sourceDrivers.map(d => ({
              name: d.name,
              team: d.team,
              number: d.number,
              active: d.active,
              imageUrl: d.imageUrl,
              driverCode: d.driverCode,
              seasonId: newSeason.id
            }))
          });
          driversCreated = sourceDrivers.length;
        }
      }

      // Import drivers from F1 API
      if (f1Drivers.length > 0) {
        await tx.driver.createMany({
          data: f1Drivers.map(d => ({
            name: d.name,
            team: d.team,
            number: d.number,
            driverCode: d.driverCode,
            imageUrl: d.imageUrl,
            active: true,
            seasonId: newSeason.id
          }))
        });
        driversCreated = f1Drivers.length;
      }

      // Import events from F1 API
      if (f1Events.length > 0) {
        await tx.event.createMany({
          data: f1Events.map(e => ({
            name: e.name,
            type: e.type,
            date: e.date,
            closingDate: e.closingDate,
            sessionKey: e.sessionKey,
            meetingKey: e.meetingKey,
            circuitName: e.circuitName,
            countryName: e.countryName,
            status: 'UPCOMING',
            seasonId: newSeason.id
          }))
        });
        eventsCreated = f1Events.length;
      }

      return { season: newSeason, driversCreated, eventsCreated };
    });

    return apiResponse({
      season: result.season,
      driversCreated: result.driversCreated,
      eventsCreated: result.eventsCreated,
      message: `Stagione creata${result.driversCreated > 0 ? `, ${result.driversCreated} piloti importati` : ''}${result.eventsCreated > 0 ? `, ${result.eventsCreated} eventi importati` : ''}`
    }, 201);
  } catch (error) {
    console.error('Error creating season:', error);
    return apiResponse({ error: 'Errore nella creazione della stagione' }, 500);
  }
}

export const GET = withAuthAPI(getHandler);
export const POST = withAuthAPI(postHandler, { requiredRole: 'ADMIN' });
