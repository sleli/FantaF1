'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SkeletonEventCard } from '@/components/ui/Skeleton';
import { ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Driver, ScoringType } from '@prisma/client';
import EventResultComparison from './EventResultComparison';

interface CompletedEvent {
  id: string;
  name: string;
  type: 'RACE' | 'SPRINT';
  date: string;
  closingDate: string;
  status: string;
  countryFlag?: string | null;
  circuitImage?: string | null;
  circuitName?: string | null;
  firstPlace?: { id: string; name: string; team: string; number: number } | null;
  secondPlace?: { id: string; name: string; team: string; number: number } | null;
  thirdPlace?: { id: string; name: string; team: string; number: number } | null;
  results?: string[] | null;
  season?: { id: string; name: string; scoringType: string } | null;
  _count: {
    predictions: number;
  };
}

interface Prediction {
  id: string;
  eventId: string;
  points: number | null;
  firstPlaceId?: string | null;
  secondPlaceId?: string | null;
  thirdPlaceId?: string | null;
  rankings?: string[] | null;
  event: any;
}

interface CompletedEventsProps {
  onEditEvent?: (event: any) => void;
  refreshTrigger?: number;
}

const INITIAL_LIMIT = 5;

export default function CompletedEvents({
  onEditEvent,
  refreshTrigger,
}: CompletedEventsProps) {
  const { data: session, status } = useSession();
  const [completedEvents, setCompletedEvents] = useState<CompletedEvent[]>([]);
  const [predictions, setPredictions] = useState<Map<string, Prediction>>(new Map());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (refreshTrigger !== undefined && status === 'authenticated') {
      fetchData();
    }
  }, [refreshTrigger, status]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [eventsRes, predictionsRes, driversRes] = await Promise.all([
        fetch('/api/events?status=COMPLETED'),
        fetch('/api/predictions'),
        fetch('/api/drivers'),
      ]);

      // Handle events
      if (eventsRes.status === 204) {
        setCompletedEvents([]);
      } else if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const events = (eventsData.events || []) as CompletedEvent[];
        // Most recent first
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setCompletedEvents(events);
      } else {
        throw new Error('Errore nel caricamento degli eventi');
      }

      // Handle predictions
      if (predictionsRes.status === 204) {
        setPredictions(new Map());
      } else if (predictionsRes.ok) {
        const predsData = await predictionsRes.json();
        const predsMap = new Map<string, Prediction>();
        (predsData as Prediction[]).forEach((p) => {
          predsMap.set(p.eventId, p);
        });
        setPredictions(predsMap);
      }

      // Handle drivers
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.drivers || []);
      }
    } catch (err) {
      console.error('Error fetching completed events:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  };

  if (isLoading) {
    return (
      <div className="mt-10">
        <h2 className="text-xl font-bold text-foreground mb-4">Eventi Conclusi</h2>
        <div className="space-y-4">
          <SkeletonEventCard />
          <SkeletonEventCard />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || completedEvents.length === 0) {
    return null;
  }

  if (error) {
    return (
      <div className="mt-10">
        <h2 className="text-xl font-bold text-foreground mb-4">Eventi Conclusi</h2>
        <Card>
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-destructive font-medium mb-2">
              Errore nel caricamento
            </p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchData}>
              Riprova
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const displayedEvents = showAll
    ? completedEvents
    : completedEvents.slice(0, INITIAL_LIMIT);
  const hasMore = completedEvents.length > INITIAL_LIMIT;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-foreground mb-4">Eventi Conclusi</h2>

      <div className="space-y-4">
        {displayedEvents.map((event) => {
          const prediction = predictions.get(event.id) || null;
          const isExpanded = expandedEventId === event.id;
          const eventDate = new Date(event.date);
          const scoringType =
            event.season?.scoringType || ScoringType.LEGACY_TOP3;

          return (
            <Card key={event.id} padding="none" className="overflow-hidden">
              {/* Collapsed card */}
              <div className="p-4 md:p-5">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="completed" size="sm">Completato</Badge>
                  <Badge
                    variant={event.type === 'RACE' ? 'race' : 'sprint'}
                    size="sm"
                  >
                    {event.type === 'RACE' ? 'Gara' : 'Sprint'}
                  </Badge>
                </div>

                {/* Event name + date */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      {event.countryFlag && (
                        <img
                          src={event.countryFlag}
                          alt=""
                          className="w-6 h-4 object-cover rounded-sm inline-block flex-shrink-0"
                        />
                      )}
                      <span className="truncate">{event.name}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {eventDate.toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* User score badge */}
                  <div className="flex-shrink-0">
                    {prediction?.points !== null && prediction?.points !== undefined ? (
                      <Badge variant="info" size="lg">
                        {prediction.points} pt
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Nessun pronostico
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpand(event.id)}
                    rightIcon={
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    }
                  >
                    Risultato
                  </Button>

                  {isAdmin && onEditEvent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditEvent(event)}
                    >
                      Gestisci
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded comparison */}
              {isExpanded && (
                <div className="px-4 pb-4 md:px-5 md:pb-5 animate-in slide-in-from-top-2 duration-200">
                  <EventResultComparison
                    event={event}
                    prediction={prediction}
                    drivers={drivers}
                    scoringType={scoringType}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Show all button */}
      {hasMore && !showAll && (
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
            Mostra tutti ({completedEvents.length} eventi)
          </Button>
        </div>
      )}
    </div>
  );
}
