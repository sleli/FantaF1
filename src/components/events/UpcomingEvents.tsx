'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Event {
  id: string;
  name: string;
  type: 'RACE' | 'SPRINT';
  date: string;
  closingDate: string;
  status: string;
  _count: {
    predictions: number;
  };
}

interface UpcomingEventsProps {
  onEditEvent?: (event: Event) => void;
  refreshTrigger?: number; // Add this to trigger refresh from parent
}

export default function UpcomingEvents({ onEditEvent, refreshTrigger }: UpcomingEventsProps) {
  const { data: session } = useSession();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchUpcomingEvents();
    }
  }, [refreshTrigger]);

  const fetchUpcomingEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/events?upcoming=true');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento degli eventi');
      }
      
      const data = await response.json();
      const upcoming = data.events.filter((e: Event) => e.status === 'UPCOMING');
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

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Prossimi Eventi</h2>
        <Card>
          <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
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
          <div className="p-6">
          <div className="text-center text-destructive">
            <p>Errore nel caricamento degli eventi: {error}</p>
            <button
              onClick={fetchUpcomingEvents}
              className="mt-2 text-sm text-primary hover:text-primary/90 underline"
            >
              Riprova
            </button>
          </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-4">Prossimi Eventi</h2>
      <Card className="overflow-hidden">
        {upcomingEvents.length > 0 ? (
          <div className="divide-y divide-border">
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.date);
              const closingDate = new Date(event.closingDate);
              const now = new Date();
              const isClosingSoon = closingDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000; // Meno di 24h
              
              return (
                <div key={event.id} className="p-6 hover:bg-foreground/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-foreground">
                          {event.name}
                        </h3>
                        <Badge variant={event.type === 'RACE' ? 'error' : 'info'}>
                          {event.type}
                        </Badge>
                        {isClosingSoon && (
                          <Badge variant="warning">⏰ Chiusura imminente</Badge>
                        )}
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">📅 Evento:</span>
                          <span className="font-medium">
                            {eventDate.toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">🔒 Chiusura:</span>
                          <span className={`font-medium ${isClosingSoon ? 'text-yellow-500' : ''}`}>
                            {closingDate.toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">👥 Pronostici:</span>
                          <span className="font-medium">
                            {event._count?.predictions || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">⏱️ Tempo rimasto:</span>
                          <span className={`font-medium ${isClosingSoon ? 'text-yellow-500' : 'text-green-500'}`}>
                            {(() => {
                              const diff = closingDate.getTime() - now.getTime();
                              if (diff <= 0) return 'Chiuso';
                              
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                              
                              if (days > 0) return `${days}g ${hours}h`;
                              if (hours > 0) return `${hours}h ${minutes}m`;
                              return `${minutes}m`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Gestisci button - only for admins */}
                      {isAdmin && (
                        <Button
                          onClick={() => handleEditEvent(event)}
                          variant="outline"
                          size="sm"
                          leftIcon={<span>✏️</span>}
                        >
                          Gestisci
                        </Button>
                      )}
                      
                      {/* Pronostici button - for all users */}
                      <Link
                        href={`/predictions?event=${event.id}`}
                        className="inline-flex items-center justify-center text-sm font-bold uppercase tracking-wider rounded transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent px-5 py-2.5 gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        <span className="flex-shrink-0">🎯</span>
                        Pronostici
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-lg font-medium mb-2">Nessun evento in programma</p>
            <p className="text-sm text-muted-foreground mb-4">
              Non ci sono eventi con stato "In Arrivo" al momento.
            </p>
            {isAdmin && (
              <Link 
                href="/admin/events"
                className="inline-flex items-center justify-center text-sm font-bold uppercase tracking-wider rounded transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent px-6 py-3.5 gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span className="flex-shrink-0">➕</span>
                Crea il primo evento
              </Link>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
