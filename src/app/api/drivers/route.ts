import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

// API route to get active drivers - requires authentication but not admin
async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    return apiResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const drivers = await prisma.driver.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return apiResponse({ drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return apiResponse({ error: 'Failed to fetch drivers' }, 500);
  }
}

// Wrap the handler with auth protection (any authenticated user)
export const GET = withAuthAPI(handler);
