import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

// Helper to extract ID from the URL
function extractIdFromPath(req: NextRequest): string | null {
  const path = req.nextUrl.pathname;
  const segments = path.split('/');
  const id = segments[segments.length - 1];
  return id || null;
}

// Admin-only API route to manage a single driver
async function handler(req: NextRequest) {
  const driverId = extractIdFromPath(req);
  
  if (!driverId) {
    return apiResponse({ error: 'Driver ID is required' }, 400);
  }
  
  // GET /api/admin/drivers/[id] - Get a single driver
  if (req.method === 'GET') {
    try {
      const driver = await prisma.driver.findUnique({
        where: {
          id: driverId
        }
      });
      
      if (!driver) {
        return apiResponse({ error: 'Driver not found' }, 404);
      }
      
      return apiResponse({ driver });
    } catch (error) {
      console.error('Error fetching driver:', error);
      return apiResponse({ error: 'Failed to fetch driver' }, 500);
    }
  }
  
  // PUT /api/admin/drivers/[id] - Update a driver
  if (req.method === 'PUT') {
    try {
      const data = await req.json();
      
      // Validate required fields
      if (!data.name || !data.team || !data.number) {
        return apiResponse({ error: 'Missing required fields' }, 400);
      }
      
      // Check if the number is already used by another driver
      if (data.number) {
        const existingDriver = await prisma.driver.findFirst({
          where: {
            number: data.number,
            id: {
              not: driverId
            }
          }
        });
        
        if (existingDriver) {
          return apiResponse({ error: 'A driver with this number already exists' }, 409);
        }
      }
      
      // Update the driver
      const driver = await prisma.driver.update({
        where: {
          id: driverId
        },
        data: {
          name: data.name,
          team: data.team,
          number: data.number,
          active: data.active !== undefined ? data.active : true
        }
      });
      
      return apiResponse({ driver });
    } catch (error) {
      console.error('Error updating driver:', error);
      return apiResponse({ error: 'Failed to update driver' }, 500);
    }
  }
  
  // DELETE /api/admin/drivers/[id] - Delete a driver
  if (req.method === 'DELETE') {
    try {
      // Check if driver is used in any predictions or results
      const usageCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "predictions" 
        WHERE "firstPlaceId" = ${driverId}
        OR "secondPlaceId" = ${driverId}
        OR "thirdPlaceId" = ${driverId}
      `;
      
      const eventUsageCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "events" 
        WHERE "firstPlaceId" = ${driverId}
        OR "secondPlaceId" = ${driverId}
        OR "thirdPlaceId" = ${driverId}
      `;
      
      if (Number(usageCount[0].count) > 0 || Number(eventUsageCount[0].count) > 0) {
        // Instead of deleting, mark as inactive
        const driver = await prisma.driver.update({
          where: {
            id: driverId
          },
          data: {
            active: false
          }
        });
        
        return apiResponse({ 
          driver,
          message: 'Driver set to inactive because it is used in predictions or results'
        });
      }
      
      // Safe to delete if not used
      await prisma.driver.delete({
        where: {
          id: driverId
        }
      });
      
      return apiResponse({ message: 'Driver deleted successfully' });
    } catch (error) {
      console.error('Error deleting driver:', error);
      return apiResponse({ error: 'Failed to delete driver' }, 500);
    }
  }
  
  // Method not allowed
  return apiResponse({ error: 'Method not allowed' }, 405);
}

// Wrap the handler with auth protection requiring ADMIN role
export const GET = withAuthAPI(handler, { requiredRole: 'ADMIN' });
export const PUT = withAuthAPI(handler, { requiredRole: 'ADMIN' });
export const DELETE = withAuthAPI(handler, { requiredRole: 'ADMIN' });
