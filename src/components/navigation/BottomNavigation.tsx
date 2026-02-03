'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  HomeIcon,
  ChartBarIcon,
  TrophyIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  TrophyIcon as TrophyIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

export default function BottomNavigation() {
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
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      name: 'Pronostici',
      href: '/predictions',
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid,
    },
    {
      name: 'Classifica',
      href: '/leaderboard',
      icon: TrophyIcon,
      activeIcon: TrophyIconSolid,
    },
    ...(isAdmin
      ? [
          {
            name: 'Admin',
            href: '/admin',
            icon: Cog6ToothIcon,
            activeIcon: Cog6ToothIconSolid,
          },
        ]
      : []),
  ];

  return (
    <div
      className="
        md:hidden fixed bottom-0 left-0 right-0 z-50
        glass-nav border-t border-border
        shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.3)]
      "
    >
      <nav className="flex justify-around items-center h-[72px] px-2 safe-area-bottom">
        {navigationItems.map((item) => {
          const isActive = isActivePage(item.href);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                w-full h-full space-y-1 relative group
                touch-active
                ${isActive ? 'text-primary' : 'text-muted-foreground'}
              `}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span
                  className="
                    absolute top-2 left-1/2 -translate-x-1/2
                    w-12 h-8 bg-primary/15 rounded-2xl
                    animate-scale-in
                  "
                />
              )}

              {/* Icon container */}
              <div
                className={`
                  relative z-10 p-1 rounded-2xl transition-all duration-300
                  ${isActive ? '' : 'group-hover:bg-foreground/5 group-active:scale-95'}
                `}
              >
                <Icon
                  className={`
                    h-7 w-7 transition-all duration-300
                    ${isActive ? 'scale-110' : 'scale-100'}
                  `}
                />
              </div>

              {/* Label */}
              <span
                className={`
                  relative z-10 text-[11px] font-bold leading-none
                  transition-colors duration-200
                  ${isActive ? 'text-primary' : 'group-hover:text-foreground'}
                `}
              >
                {item.name}
              </span>

              {/* Bottom dot indicator */}
              {isActive && (
                <span
                  className="
                    absolute bottom-2 w-1.5 h-1.5 bg-primary rounded-full
                    shadow-[0_0_8px_rgba(225,6,0,0.8)]
                    animate-fade-in
                  "
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
