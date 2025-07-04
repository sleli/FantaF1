'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuthStatus from '@/components/auth/AuthStatus';
import MobileMenu from './MobileMenu';

export default function MainNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const isActivePage = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
    },
    {
      name: 'I Miei Pronostici',
      href: '/predictions',
    },
    {
      name: 'Tutti i Pronostici',
      href: '/all-predictions',
    },
    {
      name: 'Classifica',
      href: '/leaderboard',
    },
    {
      name: 'Profilo',
      href: '/profile',
    },
  ];

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-f1-red to-red-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">F1</span>
              </div>
              <h1 className="text-2xl font-bold text-f1-red">FantaF1</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePage(item.href)
                      ? 'text-f1-red bg-red-50'
                      : 'text-gray-600 hover:text-f1-red hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Admin Link for Desktop */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePage('/admin')
                      ? 'text-f1-red bg-red-50'
                      : 'text-gray-600 hover:text-f1-red hover:bg-gray-50'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right side - Auth Status and Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Auth Status - Hidden on small screens when menu is open */}
            <div className={`${isMobileMenuOpen ? 'hidden' : 'block'} md:block`}>
              <AuthStatus />
            </div>
            
            {/* Mobile Menu */}
            <div className="relative">
              <MobileMenu
                isOpen={isMobileMenuOpen}
                onToggle={handleMobileMenuToggle}
                onClose={handleMobileMenuClose}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
