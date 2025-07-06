import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/bulk-predictions/events - Get all events for bulk predictions interface
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 401 }
      );
    }

    const events = await prisma.event.findMany({
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
        { date: 'desc' } // Most recent first for easier access
      ]
    });

    return NextResponse.json({ events });

  } catch (error) {
    console.error('Errore nel recupero eventi per bulk predictions:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
