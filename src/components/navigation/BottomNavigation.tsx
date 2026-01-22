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
    {
      name: 'Profilo',
      href: '/profile',
      icon: UserIcon,
      activeIcon: UserIconSolid,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-bottom z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <nav className="flex justify-around items-center h-16 px-2 safe-area-bottom">
        {navigationItems.map((item) => {
          const isActive = isActivePage(item.href);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-f1-red' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-6 w-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-1 bg-f1-red rounded-t-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
