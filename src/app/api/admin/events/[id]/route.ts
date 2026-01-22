import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { eventValidation, eventStatusValidation, eventUpdateValidation } from '@/lib/validation/event';
import { calculateScore, validateEventResults, validatePrediction } from '@/lib/scoring';
import { ScoringType } from '@prisma/client';

// Helper function per calcolare automaticamente i punteggi di un evento
async function calculateScoresForEvent(eventId: string): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      season: true,
      firstPlace: true,
      secondPlace: true,
      thirdPlace: true,
      predictions: {
        include: {
          firstPlace: true,
          secondPlace: true,
          thirdPlace: true
        }
      }
    }
  });

  if (!event) {
    throw new Error('Evento non trovato');
  }

  const scoringType = event.season?.scoringType || ScoringType.LEGACY_TOP3;

  // Verifica validità dati in base al tipo di scoring
  if (!validateEventResults(event, scoringType)) {
      throw new Error('Risultati evento mancanti o incompleti per il tipo di scoring');
  }

  const eventResult = {
    firstPlaceId: event.firstPlaceId,
    secondPlaceId: event.secondPlaceId,
    thirdPlaceId: event.thirdPlaceId,
    results: event.results
  };

  const scoreUpdates = [];

  for (const prediction of event.predictions) {
    // Usa validazione centralizzata
    if (!validatePrediction(prediction, scoringType)) continue;

    const predictionResult = {
      firstPlaceId: prediction.firstPlaceId,
      secondPlaceId: prediction.secondPlaceId,
      thirdPlaceId: prediction.thirdPlaceId,
      rankings: prediction.rankings
    };

    const points = calculateScore(predictionResult, eventResult, event.type, scoringType);
    
    scoreUpdates.push({ id: prediction.id, points });
  }

  // Aggiorna tutti i punteggi in una transazione
  if (scoreUpdates.length > 0) {
    await prisma.$transaction(
      scoreUpdates.map(update => 
        prisma.prediction.update({
          where: { id: update.id },
          data: { points: update.points }
        })
      )
    );
  }
}

// GET /api/admin/events/[id] - Ottieni evento singolo
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        season: true,
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true,
        predictions: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            firstPlace: true,
            secondPlace: true,
            thirdPlace: true
          }
        },
        _count: {
          select: {
            predictions: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Errore nel recupero dell\'evento:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/events/[id] - Aggiorna evento
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log("Richiesta PUT ricevuta:", { 
        eventId: params.id,
        body
      });
    } catch (error) {
      console.error("Errore parsing JSON della richiesta:", error);
      return NextResponse.json(
        { error: 'Formato richiesta non valido' },
        { status: 400 }
      );
    }
    
    // Verifica che l'evento esista
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        predictions: true
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento non trovato' },
        { status: 404 }
      );
    }

    // Restrictions removed: Allow editing all events regardless of status or predictions

    // Validazione per aggiornamento risultati
    if (body.firstPlaceId || body.secondPlaceId || body.thirdPlaceId || body.results) {
      const updateData: any = {
        status: 'COMPLETED',
        updatedAt: new Date()
      };

      // Gestione FULL_GRID_DIFF (array di risultati)
      if (body.results && Array.isArray(body.results)) {
        const results = body.results as string[];
        
        // Verifica duplicati
        if (new Set(results).size !== results.length) {
          return NextResponse.json(
            { error: 'Lo stesso pilota non può comparire più volte nei risultati' },
            { status: 400 }
          );
        }

        updateData.results = results;
        
        // Mantieni compatibilità con legacy fields
        if (results.length > 0) updateData.firstPlaceId = results[0];
        if (results.length > 1) updateData.secondPlaceId = results[1];
        if (results.length > 2) updateData.thirdPlaceId = results[2];

      } else {
        // Gestione LEGACY_TOP3 (singoli campi)
        const { firstPlaceId, secondPlaceId, thirdPlaceId } = body;
        
        // Verifica che i piloti esistano
        if (firstPlaceId) {
          const driver = await prisma.driver.findUnique({ where: { id: firstPlaceId } });
          if (!driver) {
            return NextResponse.json(
              { error: 'Pilota primo posto non trovato' },
              { status: 400 }
            );
          }
        }
        
        if (secondPlaceId) {
          const driver = await prisma.driver.findUnique({ where: { id: secondPlaceId } });
          if (!driver) {
            return NextResponse.json(
              { error: 'Pilota secondo posto non trovato' },
              { status: 400 }
            );
          }
        }
        
        if (thirdPlaceId) {
          const driver = await prisma.driver.findUnique({ where: { id: thirdPlaceId } });
          if (!driver) {
            return NextResponse.json(
              { error: 'Pilota terzo posto non trovato' },
              { status: 400 }
            );
          }
        }

        // Verifica che non ci siano duplicati
        const positions = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(Boolean);
        if (new Set(positions).size !== positions.length) {
          return NextResponse.json(
            { error: 'Lo stesso pilota non può occupare più posizioni' },
            { status: 400 }
          );
        }

        if (firstPlaceId) updateData.firstPlaceId = firstPlaceId;
        if (secondPlaceId) updateData.secondPlaceId = secondPlaceId;
        if (thirdPlaceId) updateData.thirdPlaceId = thirdPlaceId;
      }

      // Se stiamo inserendo risultati, aggiorna status a COMPLETED (già in updateData)

      const event = await prisma.event.update({
        where: { id: params.id },
        data: updateData,
        include: {
          season: true,
          firstPlace: true,
          secondPlace: true,
          thirdPlace: true,
          _count: {
            select: {
              predictions: true
            }
          }
        }
      });

      // Automaticamente calcola i punteggi dopo aver inserito i risultati
      try {
        await calculateScoresForEvent(params.id);
        console.log(`Punteggi calcolati automaticamente per l'evento ${event.name}`);
      } catch (error) {
        console.error('Errore nel calcolo automatico punteggi:', error);
        // Non blocchiamo l'operazione se il calcolo punteggi fallisce
      }

      return NextResponse.json({ event });
    }

    // Verifica se è solo un aggiornamento di status
    if (Object.keys(body).length === 1 && body.status) {
      console.log("Aggiornamento solo status:", { 
        eventId: params.id,
        newStatus: body.status 
      });
      
      // Validazione di base per evitare valori non validi
      const validStatuses = ['UPCOMING', 'CLOSED', 'COMPLETED'];
      if (!validStatuses.includes(body.status)) {
        console.error("Status non valido:", body.status);
        return NextResponse.json(
          { error: 'Status non valido' },
          { status: 400 }
        );
      }
      
      // Verifica che l'evento esista
      const existingEvent = await prisma.event.findUnique({
        where: { id: params.id },
        include: { predictions: true }
      });

      if (!existingEvent) {
        return NextResponse.json(
          { error: 'Evento non trovato' },
          { status: 404 }
        );
      }
      
      // Verificare se la transizione di stato è valida
      if (existingEvent.status === 'COMPLETED' && body.status !== 'COMPLETED') {
        console.error("Tentativo di cambiare stato di un evento completato");
        return NextResponse.json(
          { error: 'Non è possibile cambiare lo stato di un evento completato' },
          { status: 400 }
        );
      }
      
      const event = await prisma.event.update({
        where: { id: params.id },
        data: {
          status: body.status,
          updatedAt: new Date()
        },
        include: {
          firstPlace: true,
          secondPlace: true,
          thirdPlace: true,
          _count: {
            select: {
              predictions: true
            }
          }
        }
      });

      return NextResponse.json({ event });
    }
    
    // Validazione per aggiornamento dati base
    const validation = eventUpdateValidation.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { name, type, date, closingDate, status } = validation.data;

    // Validazioni date se fornite
    if (date && closingDate) {
      const eventDate = new Date(date);
      const closingDateTime = new Date(closingDate);

      if (closingDateTime >= eventDate) {
        return NextResponse.json(
          { error: 'La data di chiusura deve essere prima dell\'evento' },
          { status: 400 }
        );
      }
    }

    // Controlla nome duplicato
    if (name && name !== existingEvent.name) {
      const duplicateEvent = await prisma.event.findFirst({
        where: { 
          name,
          id: { not: params.id }
        }
      });

      if (duplicateEvent) {
        return NextResponse.json(
          { error: 'Esiste già un evento con questo nome' },
          { status: 409 }
        );
      }
    }

    // Determina nuovo status basato sulle date se necessario
    let newStatus = status || existingEvent.status;
    if (closingDate && !status) {
      const closingDateTime = new Date(closingDate);
      const now = new Date();
      
      if (closingDateTime <= now && existingEvent.status === 'UPCOMING') {
        newStatus = 'CLOSED';
      }
    }

    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (closingDate !== undefined) updateData.closingDate = new Date(closingDate);
    if (newStatus !== existingEvent.status) updateData.status = newStatus;

    const event = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
      include: {
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true,
        _count: {
          select: {
            predictions: true
          }
        }
      }
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'evento:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events/[id] - Elimina evento
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    // Verifica che l'evento esista
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        predictions: true
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento non trovato' },
        { status: 404 }
      );
    }

    // Non permettere eliminazione se ci sono pronostici
    if (existingEvent.predictions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Non è possibile eliminare un evento con pronostici esistenti',
          details: `L'evento ha ${existingEvent.predictions.length} pronostici associati`
        },
        { status: 400 }
      );
    }

    await prisma.event.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Evento eliminato con successo' 
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'evento:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
