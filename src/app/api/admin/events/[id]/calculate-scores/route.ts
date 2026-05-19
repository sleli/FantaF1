import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateScore, validateEventResults, getCatchupGapMap, applyCatchupMultiplier, resolveFullGridScoringConfig } from '@/lib/scoring'
import { autoFillMissingPredictions } from '@/lib/predictions'
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
    const scoringConfig = event.season?.scoringConfig;
    const fullGridScoringConfig = resolveFullGridScoringConfig(scoringConfig);

    // Validation
    if (!validateEventResults(event, scoringType)) {
        return NextResponse.json({ error: 'Risultati evento mancanti o incompleti per il tipo di scoring' }, { status: 400 })
    }

    // Auto-fill pronostici mancanti
    if (event.seasonId) {
        const filled = await autoFillMissingPredictions(eventId, event.seasonId, event.date);
        if (filled > 0) {
            console.log(`Auto-fill: ${filled} pronostici creati per evento ${event.name}`);
        }
    }

    // --- CALCULATION LOGIC ---
    // Fetch predictions again to include auto-filled ones
    const predictions = await prisma.prediction.findMany({
        where: { eventId },
        include: { user: true }
    });

    // Calcola gap dal leader per catch-up (solo FULL_GRID_DIFF)
    let gapMap = new Map<string, number>();
    if (scoringType === ScoringType.FULL_GRID_DIFF && event.seasonId) {
      const pastPredictions = await prisma.prediction.findMany({
        where: {
          event: {
            seasonId: event.seasonId,
            date: { lt: event.date },
            status: 'COMPLETED'
          },
          points: { not: null }
        },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      });
      gapMap = await getCatchupGapMap(pastPredictions, scoringType);
    }

    // Risultato dell'evento
    const eventResult = {
      firstPlaceId: event.firstPlaceId,
      secondPlaceId: event.secondPlaceId,
      thirdPlaceId: event.thirdPlaceId,
      results: event.results
    }

    // Calcola i punteggi per tutti i pronostici
    const scoreUpdates: Array<{ id: string; points: number; multiplier: number }> = []

    for (const prediction of predictions) {
      const predictionResult = {
        firstPlaceId: prediction.firstPlaceId,
        secondPlaceId: prediction.secondPlaceId,
        thirdPlaceId: prediction.thirdPlaceId,
        rankings: prediction.rankings
      }

      let points = calculateScore(predictionResult, eventResult, event.type, scoringType, scoringConfig)
      let multiplier = 1.0

      // Applica catch-up multiplier per FULL_GRID_DIFF
      if (scoringType === ScoringType.FULL_GRID_DIFF) {
        const gap = gapMap.get(prediction.userId) ?? 0;
        const result = applyCatchupMultiplier(points, gap, scoringConfig);
        points = result.finalScore;
        multiplier = result.multiplier;
      }

      scoreUpdates.push({ id: prediction.id, points, multiplier })
    }

    // Aggiorna tutti i punteggi in una transazione
    await prisma.$transaction(
      scoreUpdates.map(update => 
        prisma.prediction.update({
          where: { id: update.id },
          data: { points: update.points, multiplier: update.multiplier }
        })
      )
    )

    const catchupCount = scoreUpdates.filter(u => u.multiplier < 1.0).length;
    console.log(`Punteggi calcolati per ${scoreUpdates.length} pronostici dell'evento ${event.name}${catchupCount > 0 ? ` (${catchupCount} con catch-up x${fullGridScoringConfig.catchup.multiplier})` : ''}`)

    // Restituisci un riepilogo
    const summary = {
      eventName: event.name,
      eventType: event.type,
      scoringType,
      scoringConfig: scoringType === ScoringType.FULL_GRID_DIFF ? fullGridScoringConfig : null,
      totalPredictions: scoreUpdates.length,
      catchupCount,
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
