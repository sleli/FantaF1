'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  HomeIcon,
  ChartBarIcon,
  TrophyIcon,
  UserIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserIcon as UserIconSolid,
  UserGroupIcon as UserGroupIconSolid
} from '@heroicons/react/24/solid';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActivePage = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      name: 'I Miei',
      href: '/predictions',
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid,
    },
    {
      name: 'Tutti',
      href: '/all-predictions',
      icon: UserGroupIcon,
      activeIcon: UserGroupIconSolid,
    },
    {
      name: 'Classifica',
      href: '/leaderboard',
      icon: TrophyIcon,
      activeIcon: TrophyIconSolid,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-white/20 pb-safe-bottom z-50 shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.1)]">
      <nav className="flex justify-around items-center h-16 px-2 safe-area-bottom">
        {navigationItems.map((item) => {
          const isActive = isActivePage(item.href);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative group ${
                isActive ? 'text-f1-red' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-red-50' : 'bg-transparent group-hover:bg-gray-50'
              }`}>
                <Icon className={`h-6 w-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
              </div>
              <span className="text-[10px] font-bold leading-none transition-colors">{item.name}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-f1-red rounded-full shadow-[0_0_8px_rgba(225,6,0,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
