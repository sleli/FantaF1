import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

// Admin-only API route to list all users
async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    return apiResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            predictions: true
          }
        }
      }
    });

    return apiResponse({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return apiResponse({ error: 'Failed to fetch users' }, 500);
  }
}

// Wrap the handler with auth protection requiring ADMIN role
export const GET = withAuthAPI(handler, { requiredRole: 'ADMIN' });
