import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateScore, validateEventResults } from '@/lib/scoring'
import { ScoringType } from '@prisma/client'

// POST /api/admin/events/[id]/calculate-scores - Calcola i punteggi per un evento
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso non autorizzato' }, { status: 401 })
    }

    const params = await context.params
    const eventId = params.id

    // Verifica che l'evento esista ed abbia risultati
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        season: true,
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
    }

    const scoringType = event.season?.scoringType || ScoringType.LEGACY_TOP3;

    // Validation
    if (!validateEventResults(event, scoringType)) {
        return NextResponse.json({ error: 'Risultati evento mancanti o incompleti per il tipo di scoring' }, { status: 400 })
    }

    // --- AUTO-FILL LOGIC ---
    if (event.seasonId) {
        const users = await prisma.user.findMany({ where: { role: 'PLAYER' } });
        const existingPreds = await prisma.prediction.findMany({ 
            where: { eventId }, 
            select: { userId: true } 
        });
        const hasPred = new Set(existingPreds.map(p => p.userId));
        const missingUsers = users.filter(u => !hasPred.has(u.id));

        console.log(`Auto-fill: Found ${missingUsers.length} users without prediction.`);

        for (const user of missingUsers) {
            // Find last prediction in season
            const lastPred = await prisma.prediction.findFirst({
                where: {
                    userId: user.id,
                    event: {
                        seasonId: event.seasonId,
                        date: { lt: event.date },
                        // status: { in: ['COMPLETED', 'CLOSED'] } // Maybe not strictly needed if we rely on date
                    }
                },
                orderBy: { event: { date: 'desc' } }
            });

            if (lastPred) {
                console.log(`Auto-filling for user ${user.name} from event ${lastPred.eventId}`);
                await prisma.prediction.create({
                    data: {
                        userId: user.id,
                        eventId: event.id,
                        firstPlaceId: lastPred.firstPlaceId,
                        secondPlaceId: lastPred.secondPlaceId,
                        thirdPlaceId: lastPred.thirdPlaceId,
                        rankings: lastPred.rankings ?? undefined
                    }
                });
            } else {
                console.log(`No previous prediction for user ${user.name} (first event?)`);
            }
        }
    }

    // --- CALCULATION LOGIC ---
    // Fetch predictions again to include auto-filled ones
    const predictions = await prisma.prediction.findMany({
        where: { eventId },
        include: { user: true } // Need user for logging/debug if needed
    });

    // Risultato dell'evento
    const eventResult = {
      firstPlaceId: event.firstPlaceId,
      secondPlaceId: event.secondPlaceId,
      thirdPlaceId: event.thirdPlaceId,
      results: event.results
    }

    // Calcola i punteggi per tutti i pronostici
    const scoreUpdates: Array<{ id: string; points: number }> = []

    for (const prediction of predictions) {
      // Skip check for top3 if we are in FULL_GRID mode, 
      // but calculateScore handles fallback.
      
      const predictionResult = {
        firstPlaceId: prediction.firstPlaceId,
        secondPlaceId: prediction.secondPlaceId,
        thirdPlaceId: prediction.thirdPlaceId,
        rankings: prediction.rankings
      }

      const points = calculateScore(predictionResult, eventResult, event.type, scoringType)
      scoreUpdates.push({ id: prediction.id, points })
    }

    // Aggiorna tutti i punteggi in una transazione
    await prisma.$transaction(
      scoreUpdates.map(update => 
        prisma.prediction.update({
          where: { id: update.id },
          data: { points: update.points }
        })
      )
    )

    console.log(`Punteggi calcolati per ${scoreUpdates.length} pronostici dell'evento ${event.name}`)

    // Restituisci un riepilogo
    const summary = {
      eventName: event.name,
      eventType: event.type,
      scoringType,
      totalPredictions: scoreUpdates.length,
      averagePoints: scoreUpdates.length > 0 
        ? scoreUpdates.reduce((sum, s) => sum + s.points, 0) / scoreUpdates.length
        : 0,
      maxPoints: scoreUpdates.length > 0 ? Math.max(...scoreUpdates.map(s => s.points)) : 0,
      minPoints: scoreUpdates.length > 0 ? Math.min(...scoreUpdates.map(s => s.points)) : 0
    }

    return NextResponse.json({
      message: 'Punteggi calcolati con successo',
      summary
    })

  } catch (error) {
    console.error('Errore nel calcolo punteggi:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
