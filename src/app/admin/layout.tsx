'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: PropsWithChildren) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isLoading = status === 'loading';
  const isAdmin = session?.user?.role === 'ADMIN';

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // If admin, render the admin layout
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Admin Sidebar */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onToggle={handleSidebarToggle}
          onClose={handleSidebarClose}
        />

        {/* Main content */}
        <div className="lg:pl-64">
          <div className="min-h-screen">
            <div className="p-4 pt-16 lg:pt-8 lg:p-8">
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
