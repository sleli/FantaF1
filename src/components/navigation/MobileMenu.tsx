'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSwipe } from '@/hooks/useSwipe';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChartBarIcon,
  TrophyIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onToggle, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  // Swipe to close menu
  const swipeRef = useSwipe<HTMLDivElement>({
    onSwipeRight: () => {
      if (isOpen) onClose();
    }
  }, { threshold: 50 });

  // Close menu when route changes
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Prevent body scroll when menu is open - DISABLED for dropdown style
  // useEffect(() => {
  //   if (isOpen) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = 'unset';
  //   }

  //   return () => {
  //     document.body.style.overflow = 'unset';
  //   };
  // }, [isOpen]);

  // Handle escape key and click outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target && !target.closest('.mobile-menu-container')) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

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
      icon: HomeIcon,
    },
    {
      name: 'Pronostici',
      href: '/predictions',
      icon: ChartBarIcon,
    },
    {
      name: 'Classifica',
      href: '/leaderboard',
      icon: TrophyIcon,
    },
  ];

  return (
    <div className="mobile-menu-container">
      {/* Hamburger Button */}
      <button
        onClick={onToggle}
        className="md:hidden p-2 rounded-md text-gray-600 hover:text-f1-red hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-f1-red focus:ring-offset-2 transition-colors"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 z-50 w-80 max-w-sm">
          {/* Menu panel */}
          <div
            ref={swipeRef}
            className="bg-white shadow-xl border border-gray-200 rounded-lg mt-2 transform transition-transform"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-f1-red to-red-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">F1</span>
                </div>
                <h2 className="text-lg font-bold text-f1-red">FantaF1</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-f1-red focus:ring-offset-2"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>



            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePage(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-f1-red text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-f1-red'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}


            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
              <div className="text-xs text-gray-500 text-center">
                FantaF1 - Fantasy Formula 1
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
