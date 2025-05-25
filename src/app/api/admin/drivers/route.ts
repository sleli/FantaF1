import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

// Admin-only API route to manage drivers
async function handler(req: NextRequest) {
  // GET /api/admin/drivers - List all drivers
  if (req.method === 'GET') {
    try {
      const drivers = await prisma.driver.findMany({
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
  
  // POST /api/admin/drivers - Create a new driver
  if (req.method === 'POST') {
    try {
      const data = await req.json();
      
      // Validate required fields
      if (!data.name || !data.team || !data.number) {
        return apiResponse({ error: 'Missing required fields' }, 400);
      }
      
      // Check if a driver with this number already exists
      const existingDriver = await prisma.driver.findUnique({
        where: {
          number: data.number
        }
      });
      
      if (existingDriver) {
        return apiResponse({ error: 'A driver with this number already exists' }, 409);
      }
      
      // Create the new driver
      const driver = await prisma.driver.create({
        data: {
          name: data.name,
          team: data.team,
          number: data.number,
          active: data.active !== undefined ? data.active : true
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
