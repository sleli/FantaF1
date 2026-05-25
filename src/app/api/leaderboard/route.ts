import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateLeaderboard, sortPredictions, calculateFullGridScoreBreakdown } from '@/lib/scoring'
import { ScoringType } from '@prisma/client'
import { getActiveSeason } from '@/lib/season'

// GET /api/leaderboard - Ottieni classifica generale
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const seasonId = searchParams.get('seasonId')

    // Determine Season context
    let targetSeason;
    if (seasonId) {
      targetSeason = await prisma.season.findUnique({
        where: { id: seasonId },
        select: { id: true, name: true, year: true, startDate: true, endDate: true, isActive: true, scoringType: true, scoringConfig: true }
      });
    } else {
      targetSeason = await getActiveSeason();
    }

    // STRICT SEASON CHECK
    if (!targetSeason) {
      return new NextResponse(null, { status: 204 });
    }

    const scoringType = targetSeason.scoringType;

    if (eventId) {
      // Classifica per evento specifico
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          season: true,
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
      })

      if (!event) {
        return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
      }

      // Sort predictions based on scoring type
      // Nota: Ora includiamo TUTTI i pronostici per questo evento, non solo quelli degli utenti abilitati.
      const sortedPredictions = sortPredictions(event.predictions, scoringType);

      const isFullGrid = scoringType === ScoringType.FULL_GRID_DIFF;
      const resultGrid = Array.isArray(event.results) ? (event.results as string[]) : [];

      const eventLeaderboard = sortedPredictions.map(prediction => {
        let breakdown: { baseScore: number; podiumBonus: number; sprintMultiplier: number } | null = null;
        if (isFullGrid && resultGrid.length > 0 && Array.isArray(prediction.rankings) && (prediction.rankings as string[]).length > 0) {
          const b = calculateFullGridScoreBreakdown(
            prediction.rankings as string[],
            resultGrid,
            event.type,
            event.season?.scoringConfig
          );
          breakdown = {
            baseScore: b.baseScore,
            podiumBonus: b.podiumBonus,
            sprintMultiplier: b.sprintMultiplier,
          };
        }

        return {
          user: prediction.user,
          prediction: {
            id: prediction.id,
            firstPlace: prediction.firstPlace,
            secondPlace: prediction.secondPlace,
            thirdPlace: prediction.thirdPlace,
            points: prediction.points,
            multiplier: prediction.multiplier,
            createdAt: prediction.createdAt,
            updatedAt: prediction.updatedAt
          },
          points: prediction.points,
          multiplier: prediction.multiplier,
          breakdown,
        };
      })

      return NextResponse.json({
        event: {
          id: event.id,
          name: event.name,
          type: event.type,
          status: event.status,
          date: event.date,
          season: event.season
        },
        leaderboard: eventLeaderboard
      })
    } else {
      // Classifica generale
      const whereClause: any = {
          points: { not: null },
          event: { seasonId: targetSeason.id },
          // Rimosso filtro userId: { in: ... } per includere chiunque abbia punti
      };

      const predictions = await prisma.prediction.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          event: {
            select: { id: true, name: true, type: true, date: true }
          }
        }
      })

      const leaderboard = calculateLeaderboard(predictions, scoringType)

      // Aggiungi posizione nella classifica
      const leaderboardWithPosition = leaderboard.map((entry, index) => ({
        position: index + 1,
        ...entry
      }))

      return NextResponse.json({
        season: targetSeason,
        leaderboard: leaderboardWithPosition,
        totalPredictions: predictions.length,
        totalUsers: leaderboard.length
      })
    }

  } catch (error) {
    console.error('Errore nel recupero classifica:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
