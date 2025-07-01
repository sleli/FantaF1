'use client';

import { ReactNode } from 'react';
import MainNavigation from '@/components/navigation/MainNavigation';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      <main>
        {children}
      </main>
    </div>
  );
}
