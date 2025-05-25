'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { ComponentType, useEffect } from 'react';

interface WithAuthProps {
  requiredRole?: UserRole;
}

/**
 * A Higher-Order Component that protects components based on authentication status and user role
 * @param Component The component to protect
 * @param requiredRole Optional role required to access this component (defaults to any authenticated user)
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  { requiredRole }: WithAuthProps = {}
) {
  return function ProtectedComponent(props: P) {
    const { data: session, status } = useSession();
    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';
    const userRole = session?.user?.role;
    
    useEffect(() => {
      // If not loading and either not authenticated or doesn't have required role
      if (!isLoading) {
        if (!isAuthenticated) {
          redirect('/login');
        } else if (requiredRole && userRole !== requiredRole) {
          redirect('/unauthorized');
        }
      }
    }, [isLoading, isAuthenticated, userRole]);

    // Show loading state while checking authentication
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // If user is authenticated and has required role (or no role required), render the component
    if (isAuthenticated && (!requiredRole || userRole === requiredRole)) {
      return <Component {...props} />;
    }

    // This return should never be reached due to the useEffect redirect,
    // but is needed to satisfy TypeScript
    return null;
  };
}
