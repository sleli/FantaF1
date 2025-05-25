'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PlusIcon, CalendarIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import EventForm from '@/components/admin/EventForm';
import EventList from '@/components/admin/EventList';

interface Event {
  id: string;
  name: string;
  type: 'RACE' | 'SPRINT';
  date: string;
  closingDate: string;
  status: 'UPCOMING' | 'CLOSED' | 'COMPLETED';
  firstPlace?: { id: string; name: string; team: string; };
  secondPlace?: { id: string; name: string; team: string; };
  thirdPlace?: { id: string; name: string; team: string; };
  _count: { predictions: number };
  createdAt: string;
  updatedAt: string;
}

export default function EventsAdminPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    closed: 0,
    completed: 0,
    races: 0,
    sprints: 0
  });

  // Redirect se non admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'ADMIN') {
      redirect('/');
    }
  }, [session, status]);

  // Carica eventi
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/events');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento degli eventi');
      }
      
      const data = await response.json();
      setEvents(data.events);
      
      // Calcola statistiche
      const newStats = {
        total: data.events.length,
        upcoming: data.events.filter((e: Event) => e.status === 'UPCOMING').length,
        closed: data.events.filter((e: Event) => e.status === 'CLOSED').length,
        completed: data.events.filter((e: Event) => e.status === 'COMPLETED').length,
        races: data.events.filter((e: Event) => e.type === 'RACE').length,
        sprints: data.events.filter((e: Event) => e.type === 'SPRINT').length
      };
      setStats(newStats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  // Filtra eventi
  useEffect(() => {
    let filtered = [...events];
    
    // Filtro per status
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }
    
    // Filtro per tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.type === filters.type);
    }
    
    // Filtro per ricerca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredEvents(filtered);
  }, [events, filters]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventSaved = () => {
    setShowForm(false);
    setEditingEvent(null);
    fetchEvents();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'eliminazione');
      }

      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestione Eventi
          </h1>
          <p className="text-gray-600">
            Gestisci gare e sprint del campionato F1
          </p>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Totali</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">In Arrivo</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Chiusi</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.closed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completati</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Gare</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.races}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Sprint</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.sprints}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Azioni e Filtri */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Ricerca */}
              <input
                type="text"
                placeholder="Cerca eventi..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              
              {/* Filtro Status */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">Tutti gli stati</option>
                <option value="UPCOMING">In arrivo</option>
                <option value="CLOSED">Chiusi</option>
                <option value="COMPLETED">Completati</option>
              </select>
              
              {/* Filtro Tipo */}
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">Tutti i tipi</option>
                <option value="RACE">Gare</option>
                <option value="SPRINT">Sprint</option>
              </select>
            </div>
            
            {/* Pulsante Nuovo Evento */}
            <button
              onClick={() => {
                setEditingEvent(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuovo Evento
            </button>
          </div>
        </div>

        {/* Lista Eventi */}
        <EventList 
          events={filteredEvents}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchEvents}
        />

        {/* Form Modal */}
        {showForm && (
          <EventForm
            event={editingEvent}
            onSave={handleEventSaved}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
