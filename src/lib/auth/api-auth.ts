import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { isUserEnabledForSeason } from '@/lib/user-season';

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

interface WithAuthAPIOptions {
  requiredRole?: UserRole;
  requireSeasonEnabled?: boolean;
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuthAPI(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse,
  options?: WithAuthAPIOptions
) {
  return async function (req: NextRequest, ...args: any[]) {
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

    if (options?.requireSeasonEnabled && token?.id) {
      const isEnabled = await isUserEnabledForSeason(token.id as string);
      if (!isEnabled) {
        return new NextResponse(
          JSON.stringify({ error: 'Non sei abilitato per questa stagione' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return handler(req, ...args);
  };
}

/**
 * Helper function to create responses for API routes
 */
export function apiResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
