import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

// Define middleware that includes withAuth for authentication
export default withAuth(
  async function middleware(req) {
    // Controllo modalità manutenzione
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    const isMaintenancePage = req.nextUrl.pathname === '/maintenance';

    // Se in modalità manutenzione e non sulla pagina di manutenzione, reindirizza
    if (isMaintenanceMode && !isMaintenancePage) {
      return NextResponse.redirect(new URL('/maintenance', req.url));
    }

    // Se non in modalità manutenzione ma sulla pagina di manutenzione, reindirizza alla home
    if (!isMaintenanceMode && isMaintenancePage) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const token = await getToken({ req });
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login');
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
    const isApiRoute = req.nextUrl.pathname.startsWith('/api');

    // Check user role from token
    const userRole = token?.role || 'PLAYER';
    const isAdmin = userRole === 'ADMIN';

    // Redirect flows
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return null;
    }

    // Protect admin routes - only admin users can access
    if (isAdminPage && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // API route protection for specific routes that need role-based access
    if (isApiRoute) {
      // Allow auth API routes always
      if (req.nextUrl.pathname.startsWith('/api/auth')) {
        return null;
      }

      // Protect admin API routes
      if (req.nextUrl.pathname.startsWith('/api/admin') && !isAdmin) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return null;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      error: '/error',
    },
  }
);

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
