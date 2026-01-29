import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  // Check maintenance mode first
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const isMaintenancePage = req.nextUrl.pathname === '/maintenance';
  const isMaintenanceApi = req.nextUrl.pathname === '/api/maintenance-status';
  const isAuthApi = req.nextUrl.pathname.startsWith('/api/auth');
  const isStaticFile = req.nextUrl.pathname.startsWith('/_next/') || 
                       req.nextUrl.pathname.includes('.') ||
                       req.nextUrl.pathname === '/favicon.ico';
  
  // If in maintenance mode, redirect to maintenance page (except for maintenance page itself and essential APIs)
  if (isMaintenanceMode && !isMaintenancePage && !isMaintenanceApi && !isAuthApi && !isStaticFile) {
    return NextResponse.redirect(new URL('/maintenance', req.url));
  }

  // Get token for authentication checks
  const token = await getToken({ req });
  const isAuth = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  const isRootPage = req.nextUrl.pathname === '/';
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isProfilePage = req.nextUrl.pathname.startsWith('/profile');

  // Check user role from token
  const userRole = token?.role || 'PLAYER';
  const isAdmin = userRole === 'ADMIN';

  // Redirect flows for auth pages
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if ((isAdminPage || isProfilePage || isRootPage) && !isAuth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Protect admin routes - only admin users can access
  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // API route protection for specific routes that need role-based access
  if (isApiRoute) {
    // Allow auth API routes always
    if (req.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    // Protect admin API routes
    if (req.nextUrl.pathname.startsWith('/api/admin') && !isAdmin) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
