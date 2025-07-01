'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import AuthStatus from '@/components/auth/AuthStatus';
import PublicLayout from '@/components/layout/PublicLayout';
import { usePullToRefresh } from '@/hooks/useSwipe';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Pull to refresh functionality
  const handleRefresh = async () => {
    window.location.reload();
  };

  const pullToRefreshRef = usePullToRefresh(handleRefresh, {
    threshold: 80,
    enabled: true
  });
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-f1-red via-red-600 to-red-800 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative bg-white/95 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-2xl max-w-lg w-full border border-white/20 text-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-f1-red to-red-700 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">F1</span>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">FantaF1</h1>
          <p className="text-gray-600 text-xl mb-2">Benvenuto nella piattaforma</p>
          <p className="text-f1-red text-lg font-semibold mb-8">Fantasy Formula 1</p>

          <div className="mb-8">
            <AuthStatus />
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 gap-4 text-left">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-3 h-3 bg-f1-red rounded-full"></div>
              <span>🏎️ Pronostici sui podi delle gare</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-3 h-3 bg-f1-red rounded-full"></div>
              <span>🏆 Classifica in tempo reale</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-3 h-3 bg-f1-red rounded-full"></div>
              <span>👥 Sfide con i tuoi amici</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <PublicLayout>
      
      <main ref={pullToRefreshRef} className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 transition-transform duration-300">
        <div className="card mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard FantaF1</h2>
          <p className="text-gray-600 mb-6">
            Benvenuto nella tua dashboard! Qui potrai gestire i tuoi pronostici per le gare di Formula 1.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/predictions" className="card bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 I Miei Pronostici</h3>
              <p className="text-blue-700">Gestisci i tuoi pronostici per le gare di Formula 1</p>
            </Link>
            
            <Link href="/leaderboard" className="card bg-green-50 border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
              <h3 className="text-lg font-semibold text-green-900 mb-2">🏆 Classifica</h3>
              <p className="text-green-700">Vedi la classifica generale e i tuoi punti</p>
            </Link>
            
            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">🏁 Prossima Gara</h3>
              <p className="text-yellow-700">Controlla i prossimi eventi in programma</p>
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
