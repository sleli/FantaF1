import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

/**
 * Utility to check if user is authenticated for API routes
 */
export async function isAuthenticated(req: NextRequest) {
  const token = await getToken({ req });
  return !!token;
}

/**
 * Utility to check if user has admin role for API routes
 */
export async function isAdmin(req: NextRequest) {
  const token = await getToken({ req });
  return token?.role === 'ADMIN';
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuthAPI(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options?: { requiredRole?: UserRole }
) {
  return async function (req: NextRequest) {
    const token = await getToken({ req });
    const isAuth = !!token;
    
    if (!isAuth) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autenticato' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (options?.requiredRole && token?.role !== options.requiredRole) {
      return new NextResponse(
        JSON.stringify({ error: 'Accesso negato' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(req);
  };
}

/**
 * Helper function to create responses for API routes
 */
export function apiResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
