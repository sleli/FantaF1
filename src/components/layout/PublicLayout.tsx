'use client';

import { ReactNode } from 'react';
import MainNavigation from '@/components/navigation/MainNavigation';
import BottomNavigation from '@/components/navigation/BottomNavigation';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <MainNavigation />
      <main>
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
