import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ScoringType } from '@prisma/client'

// GET /api/predictions/[id] - Ottieni pronostico specifico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const prediction = await prisma.prediction.findUnique({
      where: { id: params.id },
      include: {
        event: true,
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true
      }
    })

    if (!prediction) {
      return NextResponse.json(
        { error: 'Pronostico non trovato' },
        { status: 404 }
      )
    }

    // Verifica che il pronostico appartenga all'utente corrente
    if (prediction.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 403 }
      )
    }

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Errore nel recupero pronostico:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// PUT /api/predictions/[id] - Modifica pronostico esistente
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Recupera il pronostico esistente con le informazioni sulla stagione
    const existingPrediction = await prisma.prediction.findUnique({
      where: { id: params.id },
      include: { 
        event: {
          include: {
            season: true
          }
        } 
      }
    })

    if (!existingPrediction) {
      return NextResponse.json(
        { error: 'Pronostico non trovato' },
        { status: 404 }
      )
    }

    // Verifica che il pronostico appartenga all'utente corrente
    if (existingPrediction.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 403 }
      )
    }

    // Verifica che l'evento sia ancora modificabile
    if (existingPrediction.event.status !== 'UPCOMING' || new Date() > existingPrediction.event.closingDate) {
      return NextResponse.json(
        { error: 'Non puoi più modificare questo pronostico' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const scoringType = existingPrediction.event.season?.scoringType || ScoringType.LEGACY_TOP3

    if (scoringType === ScoringType.FULL_GRID_DIFF) {
        const { rankings } = body

        if (!rankings || !Array.isArray(rankings)) {
             return NextResponse.json({ error: 'Rankings are required' }, { status: 400 })
        }
        
        // Relaxed validation: Allow partial rankings
        // if (rankings.length !== (existingPrediction.event.season?.driverCount || 20)) {
        //      return NextResponse.json({ error: `Must predict exactly ${existingPrediction.event.season?.driverCount} drivers` }, { status: 400 })
        // }

        const unique = new Set(rankings);
        if (unique.size !== rankings.length) {
             return NextResponse.json({ error: 'Duplicate drivers in ranking' }, { status: 400 })
        }

        // Aggiorna il pronostico
        const updatedPrediction = await prisma.prediction.update({
            where: { id: params.id },
            data: {
                rankings,
                updatedAt: new Date()
            },
            include: {
                event: true
            }
        })

        return NextResponse.json(updatedPrediction)

    } else {
        // LEGACY_TOP3 Logic
        const { firstPlaceId, secondPlaceId, thirdPlaceId } = body

        // Validazioni base
        if (!firstPlaceId || !secondPlaceId || !thirdPlaceId) {
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

        // Aggiorna il pronostico
        const updatedPrediction = await prisma.prediction.update({
            where: { id: params.id },
            data: {
                firstPlaceId,
                secondPlaceId,
                thirdPlaceId,
                updatedAt: new Date()
            },
            include: {
                event: true,
                firstPlace: true,
                secondPlace: true,
                thirdPlace: true
            }
        })

        return NextResponse.json(updatedPrediction)
    }

  } catch (error) {
    console.error('Errore nella modifica pronostico:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// DELETE /api/predictions/[id] - Elimina pronostico
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Recupera il pronostico esistente
    const existingPrediction = await prisma.prediction.findUnique({
      where: { id: params.id },
      include: { event: true }
    })

    if (!existingPrediction) {
      return NextResponse.json(
        { error: 'Pronostico non trovato' },
        { status: 404 }
      )
    }

    // Verifica che il pronostico appartenga all'utente corrente
    if (existingPrediction.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 403 }
      )
    }

    // Verifica che l'evento sia ancora modificabile
    if (existingPrediction.event.status !== 'UPCOMING' || new Date() > existingPrediction.event.closingDate) {
      return NextResponse.json(
        { error: 'Non puoi più eliminare questo pronostico' },
        { status: 400 }
      )
    }

    // Elimina il pronostico
    await prisma.prediction.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Pronostico eliminato con successo' })
  } catch (error) {
    console.error('Errore nella eliminazione pronostico:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
