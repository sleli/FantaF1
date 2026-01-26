'use client';

import { useEffect } from 'react';
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
  ChartPieIcon,
  HomeIcon,
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
      name: 'Home',
      href: '/',
      icon: HomeIcon,
    },
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

  // Navigation link component
  const NavLink = ({
    item,
    isActive,
    variant = 'default',
  }: {
    item: { name: string; href: string; icon: typeof ChartBarIcon };
    isActive: boolean;
    variant?: 'default' | 'secondary';
  }) => {
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-xl
          text-sm font-bold uppercase tracking-wide
          transition-all duration-200 min-h-[48px]
          touch-active
          ${
            isActive
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_rgba(225,6,0,0.3)]'
              : variant === 'secondary'
              ? 'text-muted-foreground hover:bg-surface-3 hover:text-foreground'
              : 'text-muted-foreground hover:bg-surface-3 hover:text-foreground'
          }
        `}
      >
        {/* Racing line indicator */}
        {isActive && (
          <span
            className="
              absolute left-0 top-1/2 -translate-y-1/2
              w-1 h-8 bg-primary-foreground rounded-r-full
              shadow-[0_0_10px_rgba(255,255,255,0.5)]
            "
          />
        )}
        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : ''}`} />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={onToggle}
        className="
          lg:hidden fixed top-4 left-4 z-50
          p-3 rounded-xl bg-card text-foreground
          shadow-elevation-3 border border-border
          hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-primary
          transition-all duration-200 touch-active
          min-w-[48px] min-h-[48px]
        "
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
        <div className="flex flex-col flex-grow bg-surface-1 border-r border-border">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div
              className="
                w-10 h-10 bg-gradient-to-br from-f1-red to-red-700
                rounded-lg shadow-glow flex items-center justify-center
                transform -skew-x-12
              "
            >
              <span className="text-white text-sm font-black italic transform skew-x-12">
                A
              </span>
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight italic">
                ADMIN<span className="text-f1-red">PANEL</span>
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-4 px-3 space-y-1 flex-1 overflow-y-auto">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.name}
                item={item}
                isActive={isActivePage(item.href)}
              />
            ))}

            <div className="mt-8 pt-6 border-t border-border">
              <p className="px-4 text-label text-muted-foreground uppercase mb-3">
                App Pubblica
              </p>
              {publicNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  isActive={false}
                  variant="secondary"
                />
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              FantaF1 Admin v2.0
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <div
            className="
              fixed top-0 left-0 h-full w-80 max-w-[85vw]
              bg-surface-1 shadow-elevation-4
              border-r border-border
              animate-slide-in-right
              flex flex-col
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-10 h-10 bg-gradient-to-br from-f1-red to-red-700
                    rounded-lg shadow-glow flex items-center justify-center
                    transform -skew-x-12
                  "
                >
                  <span className="text-white text-sm font-black italic transform skew-x-12">
                    A
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-black text-foreground tracking-tight italic">
                    ADMIN<span className="text-f1-red">PANEL</span>
                  </h1>
                </div>
              </div>
              <button
                onClick={onClose}
                className="
                  p-2 rounded-xl text-muted-foreground
                  hover:text-foreground hover:bg-surface-3
                  transition-colors min-w-[44px] min-h-[44px]
                  flex items-center justify-center
                "
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  isActive={isActivePage(item.href)}
                />
              ))}

              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="px-4 text-label text-muted-foreground uppercase mb-3">
                  Navigazione Pubblica
                </h3>
                {publicNavItems.map((item) => (
                  <NavLink
                    key={item.name}
                    item={item}
                    isActive={false}
                    variant="secondary"
                  />
                ))}
              </div>
            </nav>

            {/* Safe area bottom padding */}
            <div className="safe-area-bottom" />
          </div>
        </div>
      )}

    </>
  );
}
