'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PublicLayout from '@/components/layout/PublicLayout';
import UpcomingEvents from '@/components/events/UpcomingEvents';
import EventForm from '@/components/admin/EventForm';
import { usePullToRefresh } from '@/hooks/useSwipe';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-f1-red"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

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
  
  return (
    <PublicLayout>
      
      <main ref={pullToRefreshRef} className="page-container transition-transform duration-300">
        <div className="page-desktop-card">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Dashboard FantaF1</h2>
          <p className="text-muted-foreground mb-6">
            Benvenuto nella tua dashboard! Qui potrai gestire i tuoi pronostici per le gare di Formula 1.
          </p>
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
