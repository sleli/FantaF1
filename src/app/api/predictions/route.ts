import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CreatePredictionData } from '@/lib/types'

// GET /api/predictions - Ottieni pronostici dell'utente corrente
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    const whereClause: any = {
      userId: session.user.id
    }

    if (eventId) {
      whereClause.eventId = eventId
    }

    const predictions = await prisma.prediction.findMany({
      where: whereClause,
      include: {
        event: true,
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

    const body: CreatePredictionData = await request.json()
    const { eventId, firstPlaceId, secondPlaceId, thirdPlaceId } = body

    // Validazioni base
    if (!eventId || !firstPlaceId || !secondPlaceId || !thirdPlaceId) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    // Verifica che i piloti siano diversi
    const driverIds = [firstPlaceId, secondPlaceId, thirdPlaceId]
    const uniqueDriverIds = new Set(driverIds)
    if (uniqueDriverIds.size !== 3) {
      return NextResponse.json(
        { error: 'Devi selezionare 3 piloti diversi' },
        { status: 400 }
      )
    }

    // Verifica che l'evento esista e sia ancora aperto
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento non trovato' },
        { status: 404 }
      )
    }

    if (event.status !== 'UPCOMING' || new Date() > event.closingDate) {
      return NextResponse.json(
        { error: 'L\'evento non è più aperto per i pronostici' },
        { status: 400 }
      )
    }

    // Verifica che i piloti esistano e siano attivi
    const drivers = await prisma.driver.findMany({
      where: {
        id: { in: driverIds },
        active: true
      }
    })

    if (drivers.length !== 3) {
      return NextResponse.json(
        { error: 'Uno o più piloti selezionati non sono validi' },
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
      return NextResponse.json(
        { error: 'Hai già fatto un pronostico per questo evento' },
        { status: 400 }
      )
    }

    // Crea il pronostico
    const prediction = await prisma.prediction.create({
      data: {
        userId: session.user.id,
        eventId,
        firstPlaceId,
        secondPlaceId,
        thirdPlaceId
      },
      include: {
        event: true,
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
