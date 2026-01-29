import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CreatePredictionData } from '@/lib/types'
import { ScoringType } from '@prisma/client'
import { getActiveSeason, getRequiredActiveSeason } from '@/lib/season'
import { validatePrediction } from '@/lib/scoring'
import { isUserEnabledForSeason } from '@/lib/user-season'

// GET /api/predictions - Ottieni pronostici dell'utente corrente per la stagione attiva
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    // Ottieni la stagione attiva
    const activeSeason = await getActiveSeason();
    
    // Se non c'è una stagione attiva, l'utente non dovrebbe vedere pronostici (o lista vuota)
    if (!activeSeason) {
        return new NextResponse(null, { status: 204 });
    }

    // Validazione parametri
    const allowedParams = ['eventId'];
    const extraParams = Array.from(searchParams.keys()).filter(k => !allowedParams.includes(k));
    if (extraParams.length > 0) {
        console.warn(`[API Predictions] Parametri non supportati ignorati: ${extraParams.join(', ')}`);
    }

    console.log(`[API Predictions] Fetching predictions for user ${session.user.id}, season ${activeSeason.id}`);

    const whereClause: any = {
      userId: session.user.id,
      event: {
        seasonId: activeSeason.id
      }
    }

    if (eventId) {
      whereClause.eventId = eventId
    }

    const predictions = await prisma.prediction.findMany({
      where: whereClause,
      include: {
        event: {
          include: {
            season: {
              select: {
                scoringType: true,
                driverCount: true
              }
            }
          }
        },
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('Errore nel recupero pronostici:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// POST /api/predictions - Crea nuovo pronostico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Verifica abilitazione stagione
    const isEnabled = await isUserEnabledForSeason(session.user.id)
    if (!isEnabled) {
      return NextResponse.json(
        { error: 'Non sei abilitato per questa stagione' },
        { status: 403 }
      )
    }

    const body: CreatePredictionData = await request.json()
    const { eventId, firstPlaceId, secondPlaceId, thirdPlaceId, rankings } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID mancante' },
        { status: 400 }
      )
    }

    // Verifica che l'evento esista e sia ancora aperto
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { season: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento non trovato' },
        { status: 404 }
      )
    }

    // VERIFICA STAGIONE ATTIVA
    const activeSeason = await getActiveSeason();
    if (!activeSeason || event.seasonId !== activeSeason.id) {
         return NextResponse.json(
            { error: 'È possibile inserire pronostici solo per la stagione attiva' },
            { status: 403 }
        )
    }

    if (event.status !== 'UPCOMING' || new Date() > event.closingDate) {
      return NextResponse.json(
        { error: 'L\'evento non è più aperto per i pronostici' },
        { status: 400 }
      )
    }

    const scoringType = event.season?.scoringType || ScoringType.LEGACY_TOP3;
    const driverCount = event.season?.driverCount || 20;

    let predictionData: any = {
        userId: session.user.id,
        eventId,
    };

    if (scoringType === ScoringType.FULL_GRID_DIFF) {
        predictionData.rankings = rankings;
    } else {
        predictionData.firstPlaceId = firstPlaceId;
        predictionData.secondPlaceId = secondPlaceId;
        predictionData.thirdPlaceId = thirdPlaceId;
    }

    // Use centralized validation
    if (!validatePrediction(predictionData, scoringType)) {
         return NextResponse.json(
            { error: 'Dati pronostico non validi. Controlla che non ci siano duplicati e che tutti i campi richiesti siano compilati.' },
            { status: 400 }
        )
    }

    // Verifica se esiste già un pronostico per questo evento
    const existingPrediction = await prisma.prediction.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    })

    if (existingPrediction) {
      // Allow Update? The original code didn't allow update via POST?
      // "Hai già fatto un pronostico per questo evento"
      // If we want to allow updates, we should use upsert or separate PUT.
      // The user asked for "System to manage predictions".
      // Usually users want to update.
      // But the original code blocked it.
      // I'll stick to original behavior but ideally we should support update.
      // The UI has "IsModifying" prop, so it likely expects updates.
      // But PredictionForm does POST? 
      // Wait, PredictionForm uses `onSubmit` prop.
      // `src/hooks/useApi.ts` might tell us if it calls POST or PUT.
      // For now, I'll keep the block.
      
      return NextResponse.json(
        { error: 'Hai già fatto un pronostico per questo evento' },
        { status: 400 }
      )
    }

    // Crea il pronostico
    const prediction = await prisma.prediction.create({
      data: predictionData,
      include: {
        event: {
          include: {
            season: true
          }
        },
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true
      }
    })

    return NextResponse.json(prediction, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione pronostico:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
