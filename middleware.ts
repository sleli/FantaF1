import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

// Define middleware that includes withAuth for authentication
export default withAuth(
  async function middleware(req) {
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
    '/admin/:path*',
    '/api/admin/:path*',
    '/profile/:path*',
    '/login',
  ],
};
