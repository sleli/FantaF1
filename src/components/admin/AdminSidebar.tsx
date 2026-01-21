'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bars3Icon, 
  XMarkIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  TruckIcon,
  TrophyIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onToggle, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const isActivePage = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const adminNavItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: ChartBarIcon,
      emoji: '📊'
    },
    {
      name: 'Piloti',
      href: '/admin/drivers',
      icon: TruckIcon,
      emoji: '🏎️'
    },
    {
      name: 'Eventi',
      href: '/admin/events',
      icon: CalendarIcon,
      emoji: '📅'
    },
    {
      name: 'Stagioni',
      href: '/admin/seasons',
      icon: CalendarIcon,
      emoji: '📆'
    },
    {
      name: 'Bulk Pronostici',
      href: '/admin/bulk-predictions',
      icon: ChartPieIcon,
      emoji: '📊'
    },
    {
      name: 'Utenti',
      href: '/admin/users',
      icon: UserGroupIcon,
      emoji: '👥'
    },
  ];

  const publicNavItems = [
    {
      name: 'Classifica',
      href: '/leaderboard',
      icon: TrophyIcon,
      emoji: '🏆'
    },
    {
      name: 'Pronostici',
      href: '/predictions',
      icon: ChartPieIcon,
      emoji: '🎯'
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        aria-label="Toggle admin menu"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-gray-800 text-white shadow-lg">
          {/* Header */}
          <div className="p-4">
            <h1 className="text-xl font-bold text-red-400">⚡ Admin Panel</h1>
            <p className="text-xs text-gray-300 mt-1">FantaF1 Dashboard</p>
          </div>
          
          {/* Navigation */}
          <nav className="mt-6 px-3 space-y-1 flex-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  isActivePage(item.href)
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.emoji}</span>
                {item.name}
              </Link>
            ))}
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              {publicNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-2 px-3 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <span className="mr-3">{item.emoji}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />
          
          {/* Sidebar panel */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-sm bg-gray-800 text-white shadow-xl transform transition-transform">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h1 className="text-xl font-bold text-red-400">⚡ Admin Panel</h1>
                <p className="text-xs text-gray-300 mt-1">FantaF1 Dashboard</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePage(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Navigazione Pubblica
                </h3>
                {publicNavItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-700 p-4">
              <div className="text-xs text-gray-400 text-center">
                FantaF1 Admin Dashboard
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
