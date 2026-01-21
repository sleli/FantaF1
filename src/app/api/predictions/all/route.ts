import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveSeason } from '@/lib/season'

// GET /api/predictions/all - Ottieni tutti i pronostici di tutti gli utenti
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const isAdmin = session.user.role === 'ADMIN'

    const activeSeason = await getActiveSeason();
    if (!activeSeason) {
        return new NextResponse(null, { status: 204 });
    }

    // Filtra SEMPRE per stagione attiva
    const whereClause: any = {
        event: { seasonId: activeSeason.id }
    }

    if (eventId) {
      whereClause.eventId = eventId
    }

    const predictions = await prisma.prediction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            type: true,
            date: true,
            closingDate: true,
            status: true
          }
        },
        firstPlace: {
          select: {
            id: true,
            name: true,
            team: true,
            number: true
          }
        },
        secondPlace: {
          select: {
            id: true,
            name: true,
            team: true,
            number: true
          }
        },
        thirdPlace: {
          select: {
            id: true,
            name: true,
            team: true,
            number: true
          }
        }
      },
      orderBy: [
        { event: { date: 'desc' } },
        { createdAt: 'desc' }
      ]
    })

    // Se non è admin, nascondi i dettagli dei piloti per eventi non completati
    if (!isAdmin) {
      const filteredPredictions = predictions.map(prediction => {
        const isEventCompleted = prediction.event.status === 'COMPLETED'
        
        if (!isEventCompleted) {
          // Per eventi non completati, nascondi i dettagli dei piloti
          return {
            ...prediction,
            firstPlace: null,
            secondPlace: null,
            thirdPlace: null,
            // Aggiungi un flag per indicare che la predizione esiste ma è nascosta
            isHidden: true
          }
        }
        
        return prediction
      })
      
      return NextResponse.json(filteredPredictions)
    }

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('Errore nel recupero di tutti i pronostici:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
