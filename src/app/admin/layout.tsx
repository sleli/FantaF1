'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';

export default function AdminLayout({ children }: PropsWithChildren) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    // If not loading and either not authenticated or not admin
    if (!isLoading && (!session || !isAdmin)) {
      redirect('/unauthorized');
    }
  }, [isLoading, session, isAdmin]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If admin, render the admin layout
  if (isAdmin) {
    return (
      <div className="flex min-h-screen">
        {/* Admin sidebar */}
        <div className="w-64 bg-gray-800 text-white p-4">
          <h1 className="text-xl font-bold mb-6">Admin Dashboard</h1>
          <nav className="space-y-2">
            <a href="/admin" className="block py-2 px-4 rounded hover:bg-gray-700">Dashboard</a>
            <a href="/admin/drivers" className="block py-2 px-4 rounded hover:bg-gray-700">Piloti</a>
            <a href="/admin/events" className="block py-2 px-4 rounded hover:bg-gray-700">Eventi</a>
            <a href="/admin/users" className="block py-2 px-4 rounded hover:bg-gray-700">Utenti</a>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    );
  }

  // This return should never be reached due to the useEffect redirect
  return null;
}
