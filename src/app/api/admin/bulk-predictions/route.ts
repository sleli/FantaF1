import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for bulk prediction updates
const bulkPredictionSchema = z.object({
  eventId: z.string().cuid(),
  predictions: z.array(z.object({
    userId: z.string().cuid(),
    firstPlaceId: z.string().cuid(),
    secondPlaceId: z.string().cuid(),
    thirdPlaceId: z.string().cuid()
  }))
});

// Validation schema for copying predictions
const copyPredictionsSchema = z.object({
  sourceEventId: z.string().cuid(),
  targetEventId: z.string().cuid(),
  userIds: z.array(z.string().cuid()).optional() // If not provided, copy all
});

// GET /api/admin/bulk-predictions - Get all predictions for a specific event
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'EventId è richiesto' },
        { status: 400 }
      );
    }

    // Get the event with all predictions and users
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true,
        predictions: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            firstPlace: true,
            secondPlace: true,
            thirdPlace: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento non trovato' },
        { status: 404 }
      );
    }

    // Get all users to show empty rows for users without predictions
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    });

    // Create a map of existing predictions by userId
    const predictionMap = new Map(
      event.predictions.map(p => [p.userId, p])
    );

    // Build the response with all users, including those without predictions
    const usersWithPredictions = allUsers.map(user => ({
      user,
      prediction: predictionMap.get(user.id) || null
    }));

    return NextResponse.json({
      event,
      usersWithPredictions,
      totalUsers: allUsers.length,
      totalPredictions: event.predictions.length
    });

  } catch (error) {
    console.error('Errore nel recupero bulk predictions:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST /api/admin/bulk-predictions - Bulk update predictions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'update') {
      return await handleBulkUpdate(body);
    } else if (action === 'clear') {
      return await handleClearPredictions(body);
    } else if (action === 'copy') {
      return await handleCopyPredictions(body);
    } else {
      return NextResponse.json(
        { error: 'Azione non valida' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Errore nell\'aggiornamento bulk predictions:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

async function handleBulkUpdate(body: any) {
  const validation = bulkPredictionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Dati non validi',
        details: validation.error.errors 
      },
      { status: 400 }
    );
  }

  const { eventId, predictions } = validation.data;

  // Verify event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    return NextResponse.json(
      { error: 'Evento non trovato' },
      { status: 404 }
    );
  }

  // Validate that all drivers exist
  const driverIds = new Set<string>();
  predictions.forEach(p => {
    driverIds.add(p.firstPlaceId);
    driverIds.add(p.secondPlaceId);
    driverIds.add(p.thirdPlaceId);
  });

  const drivers = await prisma.driver.findMany({
    where: { id: { in: Array.from(driverIds) } }
  });

  if (drivers.length !== driverIds.size) {
    return NextResponse.json(
      { error: 'Uno o più piloti non esistono' },
      { status: 400 }
    );
  }

  // Validate predictions (no duplicate drivers in same prediction)
  for (const prediction of predictions) {
    const positions = [prediction.firstPlaceId, prediction.secondPlaceId, prediction.thirdPlaceId];
    if (new Set(positions).size !== positions.length) {
      return NextResponse.json(
        { error: 'Lo stesso pilota non può occupare più posizioni nella stessa previsione' },
        { status: 400 }
      );
    }
  }

  // Use transaction to update all predictions
  const result = await prisma.$transaction(async (tx) => {
    const updatedPredictions = [];

    for (const predictionData of predictions) {
      const { userId, firstPlaceId, secondPlaceId, thirdPlaceId } = predictionData;

      // Upsert prediction (create or update)
      const prediction = await tx.prediction.upsert({
        where: {
          userId_eventId: {
            userId,
            eventId
          }
        },
        update: {
          firstPlaceId,
          secondPlaceId,
          thirdPlaceId,
          updatedAt: new Date()
        },
        create: {
          userId,
          eventId,
          firstPlaceId,
          secondPlaceId,
          thirdPlaceId
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          firstPlace: true,
          secondPlace: true,
          thirdPlace: true
        }
      });

      updatedPredictions.push(prediction);
    }

    return updatedPredictions;
  });

  return NextResponse.json({
    message: 'Pronostici aggiornati con successo',
    updatedCount: result.length,
    predictions: result
  });
}

async function handleClearPredictions(body: any) {
  const { eventId } = body;

  if (!eventId) {
    return NextResponse.json(
      { error: 'EventId è richiesto' },
      { status: 400 }
    );
  }

  const deletedCount = await prisma.prediction.deleteMany({
    where: { eventId }
  });

  return NextResponse.json({
    message: 'Pronostici cancellati con successo',
    deletedCount: deletedCount.count
  });
}

async function handleCopyPredictions(body: any) {
  const validation = copyPredictionsSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Dati non validi',
        details: validation.error.errors 
      },
      { status: 400 }
    );
  }

  const { sourceEventId, targetEventId, userIds } = validation.data;

  // Verify both events exist
  const [sourceEvent, targetEvent] = await Promise.all([
    prisma.event.findUnique({ where: { id: sourceEventId } }),
    prisma.event.findUnique({ where: { id: targetEventId } })
  ]);

  if (!sourceEvent || !targetEvent) {
    return NextResponse.json(
      { error: 'Uno o entrambi gli eventi non esistono' },
      { status: 404 }
    );
  }

  // Get source predictions
  const whereClause: any = { eventId: sourceEventId };
  if (userIds && userIds.length > 0) {
    whereClause.userId = { in: userIds };
  }

  const sourcePredictions = await prisma.prediction.findMany({
    where: whereClause
  });

  if (sourcePredictions.length === 0) {
    return NextResponse.json({
      message: 'Nessun pronostico da copiare',
      copiedCount: 0
    });
  }

  // Copy predictions to target event
  const result = await prisma.$transaction(async (tx) => {
    const copiedPredictions = [];

    for (const sourcePrediction of sourcePredictions) {
      const prediction = await tx.prediction.upsert({
        where: {
          userId_eventId: {
            userId: sourcePrediction.userId,
            eventId: targetEventId
          }
        },
        update: {
          firstPlaceId: sourcePrediction.firstPlaceId,
          secondPlaceId: sourcePrediction.secondPlaceId,
          thirdPlaceId: sourcePrediction.thirdPlaceId,
          updatedAt: new Date()
        },
        create: {
          userId: sourcePrediction.userId,
          eventId: targetEventId,
          firstPlaceId: sourcePrediction.firstPlaceId,
          secondPlaceId: sourcePrediction.secondPlaceId,
          thirdPlaceId: sourcePrediction.thirdPlaceId
        }
      });

      copiedPredictions.push(prediction);
    }

    return copiedPredictions;
  });

  return NextResponse.json({
    message: 'Pronostici copiati con successo',
    copiedCount: result.length
  });
}
