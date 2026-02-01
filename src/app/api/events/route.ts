import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveSeason } from '@/lib/season';

// GET /api/events - Lista eventi per utenti normali
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const upcoming = searchParams.get('upcoming') === 'true';

    // Ottieni la stagione attiva
    const activeSeason = await getActiveSeason();

    // Se non c'è una stagione attiva, restituisci 204 No Content
    if (!activeSeason) {
        return new NextResponse(null, { status: 204 });
    }

    // Costruisci il filtro
    const where: any = {};
    
    // Validazione parametri non necessari
    const allowedParams = ['status', 'type', 'upcoming'];
    const extraParams = Array.from(searchParams.keys()).filter(k => !allowedParams.includes(k));
    if (extraParams.length > 0) {
        console.warn(`[API Events] Parametri non supportati ignorati: ${extraParams.join(', ')}`);
        // Opzionale: restituire 400 se si vuole essere strict, ma la richiesta chiede "validazione" e "logging".
        // Per ora logghiamo.
    }

    // Default: mostra solo eventi della stagione attiva
    console.log(`[API Events] Fetching events for season ${activeSeason.id}`);
    where.seasonId = activeSeason.id;

    if (status) where.status = status;
    if (type) where.type = type;
    if (upcoming) {
      where.status = { in: ['UPCOMING', 'CLOSED'] };
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        date: true,
        closingDate: true,
        status: true,
        circuitName: true,
        countryFlag: true,
        circuitImage: true,
        season: {
            select: {
                id: true,
                name: true,
                scoringType: true
            }
        },
        results: true,
        // Nascondi risultati per eventi non completati
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
        },
        _count: {
          select: {
            predictions: true
          }
        }
      },
      orderBy: [
        { date: 'asc' }
      ]
    });

    // Filtra risultati in base al status per sicurezza
    const filteredEvents = events.map(event => {
      if (event.status !== 'COMPLETED') {
        return {
          ...event,
          firstPlace: null,
          secondPlace: null,
          thirdPlace: null,
          results: null
        };
      }
      return event;
    });

    return NextResponse.json({ events: filteredEvents });
  } catch (error) {
    console.error('Errore nel recupero degli eventi:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
