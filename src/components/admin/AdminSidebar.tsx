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
    },
    {
      name: 'Piloti',
      href: '/admin/drivers',
      icon: TruckIcon,
    },
    {
      name: 'Eventi',
      href: '/admin/events',
      icon: CalendarIcon,
    },
    {
      name: 'Stagioni',
      href: '/admin/seasons',
      icon: CalendarIcon,
    },
    {
      name: 'Bulk Pronostici',
      href: '/admin/bulk-predictions',
      icon: ChartPieIcon,
    },
    {
      name: 'Utenti',
      href: '/admin/users',
      icon: UserGroupIcon,
    },
  ];

  const publicNavItems = [
    {
      name: 'Classifica',
      href: '/leaderboard',
      icon: TrophyIcon,
    },
    {
      name: 'Pronostici',
      href: '/predictions',
      icon: ChartPieIcon,
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/80 backdrop-blur text-gray-800 shadow-sm border border-gray-200 hover:bg-gray-50 focus:outline-none transition-colors"
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
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-br from-f1-red to-red-700 rounded-lg shadow-sm flex items-center justify-center transform -skew-x-12">
              <span className="text-white text-xs font-black italic transform skew-x-12">A</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight italic">
                ADMIN<span className="text-f1-red">PANEL</span>
              </h1>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-6 px-4 space-y-1 flex-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    isActivePage(item.href)
                      ? 'bg-f1-red text-white shadow-md transform scale-105'
                      : 'text-gray-500 hover:bg-red-50 hover:text-f1-red'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Public App
              </p>
              {publicNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          
          {/* Sidebar panel */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-sm bg-white shadow-2xl transform transition-transform">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-gradient-to-br from-f1-red to-red-700 rounded-lg shadow-sm flex items-center justify-center transform -skew-x-12">
                  <span className="text-white text-xs font-black italic transform skew-x-12">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-black text-gray-900 tracking-tight italic">
                    ADMIN<span className="text-f1-red">PANEL</span>
                  </h1>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                      isActive
                        ? 'bg-f1-red text-white shadow-lg'
                        : 'text-gray-500 hover:bg-red-50 hover:text-f1-red'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Navigazione Pubblica
                </h3>
                {publicNavItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
