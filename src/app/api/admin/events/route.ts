import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { eventValidation } from '@/lib/validation/event';
import { getActiveSeason } from '@/lib/season';

// GET /api/admin/events - Lista tutti gli eventi
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Costruisci il filtro
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Strict Active Season Filter
    const activeSeason = await getActiveSeason();
    
    if (activeSeason) {
      where.seasonId = activeSeason.id;
    } else {
      // Se non c'è stagione attiva, non ritornare nulla
      return NextResponse.json({ events: [] });
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        firstPlace: true,
        secondPlace: true,
        thirdPlace: true,
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

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Errore nel recupero degli eventi:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST /api/admin/events - Crea un nuovo evento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validazione input
    const validation = eventValidation.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { name, type, date, closingDate } = validation.data;

    const activeSeason = await getActiveSeason();
    if (!activeSeason) {
        return NextResponse.json({ error: 'Nessuna stagione attiva. Impossibile creare eventi.' }, { status: 400 });
    }

    // Validazione date
    const eventDate = new Date(date);
    const closingDateTime = new Date(closingDate);
    const now = new Date();

    if (eventDate <= now) {
      return NextResponse.json(
        { error: 'La data dell\'evento deve essere futura' },
        { status: 400 }
      );
    }

    if (closingDateTime >= eventDate) {
      return NextResponse.json(
        { error: 'La data di chiusura deve essere prima dell\'evento' },
        { status: 400 }
      );
    }

    if (closingDateTime <= now) {
      return NextResponse.json(
        { error: 'La data di chiusura deve essere futura' },
        { status: 400 }
      );
    }

    // Controlla se esiste già un evento con lo stesso nome NELLA STESSA STAGIONE
    const existingEvent = await prisma.event.findFirst({
      where: { 
          name,
          seasonId: activeSeason.id
      }
    });

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Esiste già un evento con questo nome nella stagione attiva' },
        { status: 409 }
      );
    }

    // Determina status basato sulle date
    let status = 'UPCOMING';
    if (closingDateTime <= now) {
      status = 'CLOSED';
    }

    const event = await prisma.event.create({
      data: {
        name,
        type,
        date: eventDate,
        closingDate: closingDateTime,
        status: status as any,
        seasonId: activeSeason.id
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

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione dell\'evento:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
