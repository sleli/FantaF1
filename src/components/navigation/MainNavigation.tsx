'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuthStatus from '@/components/auth/AuthStatus';

export default function MainNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const isActivePage = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'I Miei Pronostici', href: '/predictions' },
    { name: 'Tutti i Pronostici', href: '/all-predictions' },
    { name: 'Classifica', href: '/leaderboard' },
    { name: 'Profilo', href: '/profile' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
            <div className="w-8 h-8 bg-gradient-to-br from-f1-red to-red-700 rounded-lg shadow-sm flex items-center justify-center transform -skew-x-12">
              <span className="text-white text-xs font-black italic transform skew-x-12">F1</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tighter italic">
              FANTA<span className="text-f1-red">F1</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActivePage(item.href)
                    ? 'text-white bg-f1-red shadow-md transform scale-105'
                    : 'text-gray-500 hover:text-f1-red hover:bg-red-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {isAdmin && (
              <Link
                href="/admin"
                className={`ml-2 px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${
                  isActivePage('/admin')
                    ? 'border-f1-red text-f1-red bg-red-50'
                    : 'border-gray-200 text-gray-500 hover:border-f1-red hover:text-f1-red'
                }`}
              >
                ADMIN
              </Link>
            )}
          </div>

          {/* Auth Status */}
          <div className="flex items-center gap-4">
             <AuthStatus />
          </div>
        </div>
      </div>
    </nav>
  );
}
