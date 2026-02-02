'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SkeletonEventCard } from '@/components/ui/Skeleton';
import { CalendarIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  name: string;
  type: 'RACE' | 'SPRINT';
  date: string;
  closingDate: string;
  status: string;
  countryFlag?: string | null;
  circuitImage?: string | null;
  circuitName?: string | null;
  _count: {
    predictions: number;
  };
}

interface UpcomingEventsProps {
  onEditEvent?: (event: Event) => void;
  refreshTrigger?: number;
}

export default function UpcomingEvents({
  onEditEvent,
  refreshTrigger,
}: UpcomingEventsProps) {
  const { data: session, status } = useSession();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUpcomingEvents();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setError(null);
      setUpcomingEvents([]);
    }
  }, [status]);

  useEffect(() => {
    if (refreshTrigger !== undefined && status === 'authenticated') {
      fetchUpcomingEvents();
    }
  }, [refreshTrigger, status]);

  const fetchUpcomingEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/events?upcoming=true');

      if (response.status === 204) {
        setUpcomingEvents([]);
        return;
      }

      if (!response.ok) {
        let message = 'Errore nel caricamento degli eventi';
        try {
          const errorData = await response.json();
          message = errorData?.error || message;
        } catch {
          if (response.status === 401) {
            message = 'Accedi per vedere gli eventi';
          }
        }
        throw new Error(message);
      }

      const data = await response.json();
      const upcoming = (data.events || []).filter(
        (e: Event) => e.status === 'UPCOMING'
      );
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    if (onEditEvent) {
      onEditEvent(event);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = (closingDate: string) => {
    const now = new Date();
    const closing = new Date(closingDate);
    const diff = closing.getTime() - now.getTime();

    if (diff <= 0) return { text: 'Chiuso', isUrgent: true, isClosed: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const isUrgent = diff < 24 * 60 * 60 * 1000; // Less than 24h

    if (days > 0) return { text: `${days}g ${hours}h`, isUrgent, isClosed: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m`, isUrgent, isClosed: false };
    return { text: `${minutes}m`, isUrgent: true, isClosed: false };
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Prossimi Eventi</h2>
        <div className="space-y-4">
          <SkeletonEventCard />
          <SkeletonEventCard />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Prossimi Eventi</h2>
        <Card>
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-lg font-medium text-foreground mb-2">
              Accedi per vedere i prossimi eventi
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Effettua il login per consultare il calendario e fare pronostici.
            </p>
            <Link href="/login">
              <Button>Accedi</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Prossimi Eventi</h2>
        <Card>
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-destructive font-medium mb-2">
              Errore nel caricamento degli eventi
            </p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchUpcomingEvents}>
              Riprova
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-4">Prossimi Eventi</h2>

      {upcomingEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingEvents.map((event) => {
            const eventDate = new Date(event.date);
            const timeRemaining = getTimeRemaining(event.closingDate);

            return (
              <Card
                key={event.id}
                variant="interactive"
                className="overflow-hidden relative"
              >
                {/* Circuit image - desktop only */}
                {event.circuitImage && (
                  <img
                    src={event.circuitImage}
                    alt=""
                    className="hidden md:block absolute right-4 top-4 w-28 h-28 object-contain opacity-10 pointer-events-none"
                  />
                )}
                <div className="p-4 md:p-6 relative z-10">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={event.type === 'RACE' ? 'race' : 'sprint'}>
                          {event.type === 'RACE' ? 'Gara' : 'Sprint'}
                        </Badge>
                        {timeRemaining.isUrgent && !timeRemaining.isClosed && (
                          <Badge variant="closing">Chiusura imminente</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {event.countryFlag && (
                          <img src={event.countryFlag} alt="" className="w-6 h-4 object-cover rounded-sm inline-block" />
                        )}
                        {event.name}
                      </h3>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {eventDate.toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="w-4 h-4 text-muted-foreground" />
                      <span
                        className={
                          timeRemaining.isUrgent
                            ? 'text-accent-amber font-medium'
                            : 'text-accent-green font-medium'
                        }
                      >
                        {timeRemaining.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <UsersIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {event._count?.predictions || 0} pronostici
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                    <Link href={`/predictions?event=${event.id}`} className="flex-1 min-w-[140px]">
                      <Button fullWidth size="md">
                        Fai Pronostico
                      </Button>
                    </Link>

                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => handleEditEvent(event)}
                      >
                        Gestisci
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-lg font-medium text-foreground mb-2">
              Nessun evento in programma
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Non ci sono eventi con stato "In Arrivo" al momento.
            </p>
            {isAdmin && (
              <Link href="/admin/events">
                <Button>Crea il primo evento</Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
