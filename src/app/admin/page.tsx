'use client'

import { useEffect, useState } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalEvents: number;
  totalPredictions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalEvents: 0,
    totalPredictions: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch drivers stats
      const driversResponse = await fetch('/api/admin/drivers');
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        const drivers = driversData.drivers || [];
        setStats(prev => ({
          ...prev,
          totalDrivers: drivers.length,
          activeDrivers: drivers.filter((d: any) => d.active).length
        }));
      }

      // Fetch users stats
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = usersData.users || [];
        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          totalPredictions: users.reduce((sum: number, user: any) => sum + (user._count?.predictions || 0), 0)
        }));
      }

      // Fetch events stats
      const eventsResponse = await fetch('/api/admin/events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const events = eventsData.events || [];
        const upcoming = events.filter((e: any) => e.status === 'UPCOMING');
        
        setStats(prev => ({
          ...prev,
          totalEvents: events.length
        }));
        setUpcomingEvents(upcoming);
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Amministrativa</h1>
      <p className="text-gray-600 mb-8">Panoramica generale del sistema FantaF1</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats cards */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Utenti Totali</h2>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {isLoading ? '...' : stats.totalUsers}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Piloti Attivi</h2>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {isLoading ? '...' : stats.activeDrivers}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            su {stats.totalDrivers} totali
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Eventi Attivi</h2>
          <p className="text-3xl font-bold mt-2 text-purple-600">
            {isLoading ? '...' : stats.totalEvents}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pronostici Totali</h2>
          <p className="text-3xl font-bold mt-2 text-orange-600">
            {isLoading ? '...' : stats.totalPredictions}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/admin/drivers" 
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏎️</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">Gestisci Piloti</h3>
                <p className="text-xs text-blue-600">Aggiungi o modifica piloti</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/events" 
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📅</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-900">Eventi</h3>
                <p className="text-xs text-green-600">Crea nuovi eventi</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/users" 
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-purple-900">Utenti</h3>
                <p className="text-xs text-purple-600">Gestisci utenti</p>
              </div>
            </div>
          </Link>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-600">Statistiche</h3>
                <p className="text-xs text-gray-500">Prossimamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
                        <Link
                          href={`/admin/events`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <span className="mr-2">✏️</span>
                          Gestisci
                        </Link>
                        
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
              <Link 
                href="/admin/events"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <span className="mr-2">➕</span>
                Crea il primo evento
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
