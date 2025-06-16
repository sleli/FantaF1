import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateLeaderboard } from '@/lib/scoring'

// GET /api/leaderboard - Ottieni classifica generale
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (eventId) {
      // Classifica per evento specifico
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          predictions: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              },
              firstPlace: true,
              secondPlace: true,
              thirdPlace: true
            },
            orderBy: {
              points: 'desc'
            }
          }
        }
      })

      if (!event) {
        return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
      }

      const eventLeaderboard = event.predictions.map(prediction => ({
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
          date: event.date
        },
        leaderboard: eventLeaderboard
      })
    } else {
      // Classifica generale
      const predictions = await prisma.prediction.findMany({
        where: {
          points: { not: null }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          event: {
            select: { id: true, name: true, type: true, date: true }
          }
        },
        orderBy: {
          points: 'desc'
        }
      })

      const leaderboard = calculateLeaderboard(predictions)

      // Aggiungi posizione nella classifica
      const leaderboardWithPosition = leaderboard.map((entry, index) => ({
        position: index + 1,
        ...entry
      }))

      return NextResponse.json({
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
