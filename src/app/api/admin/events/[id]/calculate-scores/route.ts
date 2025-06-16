import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculatePoints } from '@/lib/scoring'

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
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true,
        predictions: {
          include: {
            user: true,
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

    if (!event.firstPlace || !event.secondPlace || !event.thirdPlace) {
      return NextResponse.json(
        { error: 'Risultati dell\'evento non completi' },
        { status: 400 }
      )
    }

    // Risultato dell'evento
    const eventResult = {
      firstPlaceId: event.firstPlace.id,
      secondPlaceId: event.secondPlace.id,
      thirdPlaceId: event.thirdPlace.id
    }

    // Calcola i punteggi per tutti i pronostici
    const scoreUpdates: Array<{ id: string; points: number }> = []

    for (const prediction of event.predictions) {
      if (!prediction.firstPlace || !prediction.secondPlace || !prediction.thirdPlace) {
        continue // Salta pronostici incompleti
      }

      const predictionResult = {
        firstPlaceId: prediction.firstPlace.id,
        secondPlaceId: prediction.secondPlace.id,
        thirdPlaceId: prediction.thirdPlace.id
      }

      const points = calculatePoints(predictionResult, eventResult, event.type)
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
