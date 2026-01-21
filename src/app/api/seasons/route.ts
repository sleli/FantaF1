import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { ScoringType } from '@prisma/client';

// GET: List all seasons
async function getHandler(req: NextRequest) {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: {
        startDate: 'desc'
      },
      include: {
        _count: {
          select: { events: true }
        }
      }
    });
    return apiResponse({ seasons });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return apiResponse({ error: 'Failed to fetch seasons' }, 500);
  }
}

// POST: Create new season (Admin only)
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, startDate, endDate, driverCount, scoringType } = body;

    // Basic validation
    if (!name || !startDate || !endDate) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Check unique name
    const existing = await prisma.season.findUnique({
      where: { name }
    });

    if (existing) {
      return apiResponse({ error: 'Season name already exists' }, 409);
    }

    const season = await prisma.season.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        driverCount: driverCount ? parseInt(driverCount) : 20,
        scoringType: scoringType as ScoringType || 'LEGACY_TOP3',
        isActive: false // Default to inactive
      }
    });

    return apiResponse({ season }, 201);
  } catch (error) {
    console.error('Error creating season:', error);
    return apiResponse({ error: 'Failed to create season' }, 500);
  }
}

export const GET = withAuthAPI(getHandler);
export const POST = withAuthAPI(postHandler, { requiredRole: 'ADMIN' });
