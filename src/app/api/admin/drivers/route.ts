import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { getActiveSeason } from '@/lib/season';

// Admin-only API route to manage drivers
async function handler(req: NextRequest) {
  // Check active season first - required for all operations
  const activeSeason = await getActiveSeason();
  
  if (!activeSeason) {
    // If no active season, we can't list or create drivers contextually
    // For GET, return empty list. For POST, return error.
    if (req.method === 'GET') {
        return apiResponse({ drivers: [] });
    }
    return apiResponse({ error: 'No active season found. Cannot manage drivers.' }, 400);
  }

  // GET /api/admin/drivers - List all drivers for active season
  if (req.method === 'GET') {
    try {
      // STRICT: No filtering by query params allowed. 
      // Always filter by active season.
      
      const drivers = await prisma.driver.findMany({
        where: {
            seasonId: activeSeason.id
        },
        orderBy: {
          name: 'asc'
        },
        include: {
          season: true
        }
      });
      
      return apiResponse({ drivers });
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return apiResponse({ error: 'Failed to fetch drivers' }, 500);
    }
  }
  
  // POST /api/admin/drivers - Create a new driver
  if (req.method === 'POST') {
    try {
      const data = await req.json();
      
      // Validate required fields
      if (!data.name || !data.team || !data.number) {
        return apiResponse({ error: 'Missing required fields' }, 400);
      }
      
      // Check if a driver with this number already exists IN THIS SEASON
      const existingDriver = await prisma.driver.findUnique({
        where: {
          seasonId_number: {
            seasonId: activeSeason.id,
            number: data.number
          }
        }
      });
      
      if (existingDriver) {
        return apiResponse({ error: 'A driver with this number already exists in the active season' }, 409);
      }
      
      // Create the new driver linked to active season
      const driver = await prisma.driver.create({
        data: {
            name: data.name,
            team: data.team,
            number: data.number,
            active: data.active !== undefined ? data.active : true,
            seasonId: activeSeason.id
        }
      });
      
      return apiResponse({ driver }, 201);
    } catch (error) {
      console.error('Error creating driver:', error);
      return apiResponse({ error: 'Failed to create driver' }, 500);
    }
  }
  
  // Method not allowed
  return apiResponse({ error: 'Method not allowed' }, 405);
}

// Wrap the handler with auth protection requiring ADMIN role
export const GET = withAuthAPI(handler, { requiredRole: 'ADMIN' });
export const POST = withAuthAPI(handler, { requiredRole: 'ADMIN' });
