'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
        <h2 className="text-xl font-bold text-gray-900 mb-4">Prossimi Eventi</h2>
        <div className="bg-white rounded-lg shadow-md border p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Prossimi Eventi</h2>
        <div className="bg-white rounded-lg shadow-md border p-6">
          <div className="text-center text-red-600">
            <p>Errore nel caricamento degli eventi: {error}</p>
            <button 
              onClick={fetchUpcomingEvents}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Prossimi Eventi</h2>
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        {upcomingEvents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.date);
              const closingDate = new Date(event.closingDate);
              const now = new Date();
              const isClosingSoon = closingDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000; // Meno di 24h
              
              return (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {event.name}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.type === 'RACE' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {event.type}
                        </span>
                        {isClosingSoon && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            ⏰ Chiusura imminente
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">📅 Evento:</span>
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
                          <span className="text-gray-500 mr-2">🔒 Chiusura:</span>
                          <span className={`font-medium ${isClosingSoon ? 'text-yellow-600' : ''}`}>
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
                          <span className="text-gray-500 mr-2">👥 Pronostici:</span>
                          <span className="font-medium">
                            {event._count?.predictions || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">⏱️ Tempo rimasto:</span>
                          <span className={`font-medium ${isClosingSoon ? 'text-yellow-600' : 'text-green-600'}`}>
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
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <span className="mr-2">✏️</span>
                          Gestisci
                        </button>
                      )}
                      
                      {/* Pronostici button - for all users */}
                      <Link
                        href={`/predictions?event=${event.id}`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <span className="mr-2">🎯</span>
                        Pronostici
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-lg font-medium mb-2">Nessun evento in programma</p>
            <p className="text-sm text-gray-400 mb-4">
              Non ci sono eventi con stato "In Arrivo" al momento.
            </p>
            {isAdmin && (
              <Link 
                href="/admin/events"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <span className="mr-2">➕</span>
                Crea il primo evento
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
