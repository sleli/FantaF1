import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateLeaderboard } from '@/lib/scoring'
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
    // Determine Season context
    const activeSeason = await getActiveSeason();
    
    // STRICT ACTIVE SEASON CHECK
    // If no active season is found, we must return an empty state or appropriate status code.
    if (!activeSeason) {
      // 204 No Content is appropriate for "Success, but no data to show"
      return new NextResponse(null, { status: 204 });
    }

    const scoringType = activeSeason.scoringType;

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
      const sortedPredictions = event.predictions.sort((a, b) => {
          const pointsA = a.points ?? (scoringType === ScoringType.FULL_GRID_DIFF ? 1000 : -1);
          const pointsB = b.points ?? (scoringType === ScoringType.FULL_GRID_DIFF ? 1000 : -1);
          
          if (scoringType === ScoringType.FULL_GRID_DIFF) {
              return pointsA - pointsB;
          } else {
              return pointsB - pointsA;
          }
      });

      const eventLeaderboard = sortedPredictions.map(prediction => ({
        user: prediction.user,
        prediction: {
          id: prediction.id,
          firstPlace: prediction.firstPlace,
          secondPlace: prediction.secondPlace,
          thirdPlace: prediction.thirdPlace,
          points: prediction.points,
          createdAt: prediction.createdAt,
          updatedAt: prediction.updatedAt
        },
        points: prediction.points
      }))

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
          event: { seasonId: activeSeason.id } // Enforce season filter
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
        season: activeSeason,
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
