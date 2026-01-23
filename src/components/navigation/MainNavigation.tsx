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
    <nav className="glass-nav sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
            <div className="w-10 h-10 bg-gradient-to-br from-f1-red to-red-700 rounded-lg shadow-glow flex items-center justify-center transform -skew-x-12 group-hover:skew-x-0 transition-transform duration-300">
              <span className="text-white text-sm font-black italic transform skew-x-12 group-hover:skew-x-0 transition-transform duration-300">F1</span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tighter italic">
              FANTA<span className="text-f1-red">F1</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 bg-secondary/30 p-1 rounded-full border border-border backdrop-blur-sm">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-300 relative overflow-hidden ${
                  isActivePage(item.href)
                    ? 'text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {isActivePage(item.href) && (
                  <div className="absolute inset-0 bg-primary -z-10" />
                )}
                {item.name}
              </Link>
            ))}
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
