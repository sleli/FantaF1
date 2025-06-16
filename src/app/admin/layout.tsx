'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: PropsWithChildren) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoading = status === 'loading';
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    // If not loading and either not authenticated or not admin
    if (!isLoading && (!session || !isAdmin)) {
      redirect('/unauthorized');
    }
  }, [isLoading, session, isAdmin]);

  const isActivePage = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // If admin, render the admin layout
  if (isAdmin) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Admin sidebar */}
        <div className="w-64 bg-gray-800 text-white shadow-lg">
          <div className="p-4">
            <h1 className="text-xl font-bold text-red-400">⚡ Admin Panel</h1>
            <p className="text-xs text-gray-300 mt-1">FantaF1 Dashboard</p>
          </div>
          
          <nav className="mt-6 px-3 space-y-1">
            <Link 
              href="/admin" 
              className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                isActivePage('/admin') 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </Link>
            
            <Link 
              href="/admin/drivers" 
              className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                isActivePage('/admin/drivers') 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3">🏎️</span>
              Piloti
            </Link>
            
            <Link 
              href="/admin/events" 
              className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                isActivePage('/admin/events') 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3">📅</span>
              Eventi
            </Link>
            
            <Link 
              href="/admin/users" 
              className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                isActivePage('/admin/users') 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3">👥</span>
              Utenti
            </Link>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <Link 
                href="/leaderboard" 
                className="block py-2 px-3 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <span className="mr-3">🏆</span>
                Classifica
              </Link>
              
              <Link 
                href="/predictions" 
                className="block py-2 px-3 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <span className="mr-3">🎯</span>
                Pronostici
              </Link>
            </div>
          </nav>
    
      
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This return should never be reached due to the useEffect redirect
  return null;
}
