'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PlusIcon, CalendarIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import EventForm from '@/components/admin/EventForm';
import EventList from '@/components/admin/EventList';
import { EventWithResults } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// Tipo per gli eventi con conteggio pronostici
type AdminEvent = EventWithResults & {
  _count: { predictions: number };
};

export default function EventsAdminPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
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
      setError(null);
      
      console.log('Fetching events...', { session: !!session, role: session?.user?.role });
      
      const response = await fetch('/api/admin/events');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', { status: response.status, data: errorData });
        
        if (response.status === 401) {
          throw new Error('Sessione scaduta. Ricarica la pagina per effettuare nuovamente il login.');
        }
        
        throw new Error(errorData.error || 'Errore nel caricamento degli eventi');
      }
      
      const data = await response.json();
      console.log('Events fetched successfully:', { count: data.events?.length });
      
      setEvents(data.events || []);
      
      // Calcola statistiche
      const events = data.events || [];
      const newStats = {
        total: events.length,
        upcoming: events.filter((e: AdminEvent) => e.status === 'UPCOMING').length,
        closed: events.filter((e: AdminEvent) => e.status === 'CLOSED').length,
        completed: events.filter((e: AdminEvent) => e.status === 'COMPLETED').length,
        races: events.filter((e: AdminEvent) => e.type === 'RACE').length,
        sprints: events.filter((e: AdminEvent) => e.type === 'SPRINT').length
      };
      setStats(newStats);
      
    } catch (err) {
      console.error('Fetch events error:', err);
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

  // Carica eventi quando la sessione è pronta
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      redirect('/');
      return;
    }
    
    // Se abbiamo una sessione admin valida, carica gli eventi
    fetchEvents();
  }, [session, status]);

  const handleEventSaved = () => {
    setShowForm(false);
    setEditingEvent(null);
    fetchEvents();
  };

  const handleEdit = (event: AdminEvent) => {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestione Eventi
          </h1>
          <p className="text-muted-foreground">
            Gestisci gare e sprint del campionato F1
          </p>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <div className="p-4">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Totali</p>
                <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
              </div>
            </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">In Arrivo</p>
                <p className="text-2xl font-semibold text-foreground">{stats.upcoming}</p>
              </div>
            </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Chiusi</p>
                <p className="text-2xl font-semibold text-foreground">{stats.closed}</p>
              </div>
            </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Completati</p>
                <p className="text-2xl font-semibold text-foreground">{stats.completed}</p>
              </div>
            </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Gare</p>
                <p className="text-2xl font-semibold text-foreground">{stats.races}</p>
              </div>
            </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Sprint</p>
                <p className="text-2xl font-semibold text-foreground">{stats.sprints}</p>
              </div>
            </div>
            </div>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center justify-between">
            <div>
              <strong>Errore:</strong> {error}
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-destructive hover:text-destructive/90 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Azioni e Filtri */}
        <div className="bg-card text-card-foreground border border-border rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Ricerca */}
              <input
                type="text"
                placeholder="Cerca eventi..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-4 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              
              {/* Filtro Status */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                className="px-4 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tutti i tipi</option>
                <option value="RACE">Gare</option>
                <option value="SPRINT">Sprint</option>
              </select>
            </div>
            
            {/* Pulsanti Azioni */}
            <div className="flex gap-2">
              {/* Pulsante Refresh */}
              <Button
                onClick={fetchEvents}
                disabled={loading}
                variant="secondary"
                title="Ricarica eventi"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </Button>
              
              {/* Pulsante Nuovo Evento */}
              <Button
                onClick={() => {
                  setEditingEvent(null);
                  setShowForm(true);
                }}
                leftIcon={<PlusIcon className="h-5 w-5" />}
              >
                Nuovo Evento
              </Button>
            </div>
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
