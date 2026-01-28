'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';

import AuthStatus from '@/components/auth/AuthStatus';
import PublicLayout from '@/components/layout/PublicLayout';
import UpcomingEvents from '@/components/events/UpcomingEvents';
import EventForm from '@/components/admin/EventForm';
import { usePullToRefresh } from '@/hooks/useSwipe';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'ADMIN';

  // State for event editing (admin only)
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pull to refresh functionality
  const handleRefresh = async () => {
    window.location.reload();
  };

  const pullToRefreshRef = usePullToRefresh(handleRefresh, {
    threshold: 80,
    enabled: true
  });

  // Event editing handlers (admin only)
  const handleEditEvent = (event: any) => {
    if (isAdmin) {
      setEditingEvent(event);
      setShowEventForm(true);
    }
  };

  const handleEventSaved = () => {
    setShowEventForm(false);
    setEditingEvent(null);
    setRefreshTrigger(prev => prev + 1); // Trigger refresh of UpcomingEvents
  };
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-f1-red via-red-600 to-red-800 flex items-center justify-center p-4">
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
      
      <main ref={pullToRefreshRef} className="page-container transition-transform duration-300">
        <div className="page-desktop-card">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Dashboard FantaF1</h2>
          <p className="text-muted-foreground mb-6">
            Benvenuto nella tua dashboard! Qui potrai gestire i tuoi pronostici per le gare di Formula 1.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/predictions" className="rounded-xl border border-border bg-card p-6 shadow-lg hover:border-primary/50 hover:shadow-glow hover:-translate-y-0.5 transition-all cursor-pointer">
              <h3 className="text-lg font-semibold text-foreground mb-2">📊 I Miei Pronostici</h3>
              <p className="text-muted-foreground">Gestisci i tuoi pronostici per le gare di Formula 1</p>
            </Link>

            <Link href="/all-predictions" className="rounded-xl border border-border bg-card p-6 shadow-lg hover:border-primary/50 hover:shadow-glow hover:-translate-y-0.5 transition-all cursor-pointer">
              <h3 className="text-lg font-semibold text-foreground mb-2">👥 Tutti i Pronostici</h3>
              <p className="text-muted-foreground">Vedi i pronostici di tutti i giocatori</p>
            </Link>

            <Link href="/leaderboard" className="rounded-xl border border-border bg-card p-6 shadow-lg hover:border-primary/50 hover:shadow-glow hover:-translate-y-0.5 transition-all cursor-pointer">
              <h3 className="text-lg font-semibold text-foreground mb-2">🏆 Classifica</h3>
              <p className="text-muted-foreground">Vedi la classifica generale e i tuoi punti</p>
            </Link>

            <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-2">🏁 Prossima Gara</h3>
              <p className="text-muted-foreground">Controlla i prossimi eventi in programma</p>
            </div>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <UpcomingEvents onEditEvent={handleEditEvent} refreshTrigger={refreshTrigger} />

        {/* Event Form Modal (Admin only) */}
        {isAdmin && showEventForm && (
          <EventForm
            event={editingEvent}
            onSave={handleEventSaved}
            onCancel={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
          />
        )}
        </div>
      </main>
    </PublicLayout>
  );
}
