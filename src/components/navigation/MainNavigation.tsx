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
  ];

  if (isAdmin) {
    navigationItems.push({ name: 'Admin', href: '/admin' });
  }

  return (
    <nav
      className="
        glass-nav sticky top-0 z-40
        transition-all duration-300
        border-b border-border/50
        backdrop-blur-xl
      "
    >
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 active:scale-95 transition-transform group"
          >
            <div
              className="
                w-10 h-10 bg-gradient-to-br from-f1-red to-red-700
                rounded-lg shadow-glow flex items-center justify-center
                transform -skew-x-12 group-hover:skew-x-0 transition-transform duration-300
              "
            >
              <span
                className="
                  text-white text-sm font-black italic
                  transform skew-x-12 group-hover:skew-x-0 transition-transform duration-300
                "
              >
                F1
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tighter italic">
              FANTA<span className="text-f1-red">F1</span>
            </h1>
          </Link>

          {/* Desktop Navigation - Only visible on md+ */}
          <div
            className="
              hidden md:flex items-center space-x-1
              bg-surface-2/50 p-1.5 rounded-full
              border border-border/50 backdrop-blur-sm
            "
          >
            {navigationItems.map((item) => {
              const isActive = isActivePage(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide
                    transition-all duration-300 relative overflow-hidden
                    min-h-[40px] flex items-center justify-center
                    ${
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                    }
                  `}
                >
                  {/* Active background */}
                  {isActive && (
                    <div
                      className="
                        absolute inset-0 bg-primary -z-10
                        shadow-[0_2px_10px_rgba(225,6,0,0.4)]
                      "
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
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
