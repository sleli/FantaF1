'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Driver, Event } from '@prisma/client';
import BulkPredictionsGrid from '@/components/admin/BulkPredictionsGrid';
import EventSelector from '@/components/admin/EventSelector';
import BulkOperations from '@/components/admin/BulkOperations';
import UserSearch from '@/components/admin/UserSearch';
import NotificationSystem, { useNotifications } from '@/components/admin/NotificationSystem';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type EventWithCount = Event & {
  firstPlace?: Driver;
  secondPlace?: Driver;
  thirdPlace?: Driver;
  _count: { predictions: number };
};

type UserWithPrediction = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  prediction: {
    id: string;
    firstPlaceId: string;
    secondPlaceId: string;
    thirdPlaceId: string;
    firstPlace: Driver;
    secondPlace: Driver;
    thirdPlace: Driver;
  } | null;
};

export default function BulkPredictionsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithCount | null>(null);
  const [usersWithPredictions, setUsersWithPredictions] = useState<UserWithPrediction[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      redirect('/unauthorized');
    }
  }, [session, status]);

  // Load events and drivers on mount
  useEffect(() => {
    loadEvents();
    loadDrivers();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/admin/bulk-predictions/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        
        // Auto-select active event if available
        if (data.events.length > 0) {
           const activeEvent = data.events[0]; // The API now returns only active events
           setSelectedEvent(activeEvent);
           loadPredictionsForEvent(activeEvent.id);
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Errore nel caricamento eventi',
          message: 'Impossibile caricare la lista degli eventi'
        });
      }
    } catch (error) {
      console.error('Errore nel caricamento eventi:', error);
      addNotification({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Impossibile connettersi al server'
      });
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers);
      } else {
        addNotification({
          type: 'error',
          title: 'Errore nel caricamento piloti',
          message: 'Impossibile caricare la lista dei piloti'
        });
      }
    } catch (error) {
      console.error('Errore nel caricamento piloti:', error);
      addNotification({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Impossibile connettersi al server'
      });
    }
  };

  const loadPredictionsForEvent = async (eventId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/bulk-predictions?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setUsersWithPredictions(data.usersWithPredictions);
        setHasUnsavedChanges(false);
        addNotification({
          type: 'success',
          title: 'Pronostici caricati',
          message: `Caricati ${data.usersWithPredictions.length} utenti per ${data.event.name}`
        });
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Errore nel caricamento pronostici',
          message: error.error || 'Impossibile caricare i pronostici'
        });
      }
    } catch (error) {
      console.error('Errore nel caricamento pronostici:', error);
      addNotification({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Impossibile connettersi al server'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventSelect = (event: EventWithCount) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Hai modifiche non salvate. Vuoi continuare e perdere le modifiche?'
      );
      if (!confirmed) return;
    }
    
    setSelectedEvent(event);
    loadPredictionsForEvent(event.id);
    setSearchTerm('');
  };

  const handlePredictionChange = useCallback((userId: string, field: string, value: string) => {
    setUsersWithPredictions(prev => 
      prev.map(item => {
        if (item.user.id === userId) {
          const currentPrediction = item.prediction || {
            id: '',
            firstPlaceId: '',
            secondPlaceId: '',
            thirdPlaceId: '',
            firstPlace: {} as Driver,
            secondPlace: {} as Driver,
            thirdPlace: {} as Driver
          };
          
          return {
            ...item,
            prediction: {
              ...currentPrediction,
              [field]: value
            }
          };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  }, []);

  const handleBulkSave = async () => {
    if (!selectedEvent) return;

    try {
      setIsLoading(true);
      setSaveProgress({ current: 0, total: 100 });

      // Prepare predictions data - only include users with complete predictions
      const predictions = usersWithPredictions
        .filter(item =>
          item.prediction &&
          item.prediction.firstPlaceId &&
          item.prediction.secondPlaceId &&
          item.prediction.thirdPlaceId
        )
        .map(item => ({
          userId: item.user.id,
          firstPlaceId: item.prediction!.firstPlaceId,
          secondPlaceId: item.prediction!.secondPlaceId,
          thirdPlaceId: item.prediction!.thirdPlaceId
        }));

      setSaveProgress({ current: 25, total: 100 });

      const response = await fetch('/api/admin/bulk-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update',
          eventId: selectedEvent.id,
          predictions
        })
      });

      setSaveProgress({ current: 75, total: 100 });

      if (response.ok) {
        const result = await response.json();
        addNotification({
          type: 'success',
          title: 'Salvataggio completato',
          message: `${result.updatedCount} pronostici salvati con successo!`
        });
        setHasUnsavedChanges(false);
        // Reload to get fresh data
        loadPredictionsForEvent(selectedEvent.id);
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Errore nel salvataggio',
          message: error.error || 'Impossibile salvare i pronostici'
        });
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      addNotification({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Impossibile connettersi al server'
      });
    } finally {
      setIsLoading(false);
      setSaveProgress(null);
    }
  };

  const handleBulkOperation = async (operation: string, data?: any) => {
    if (!selectedEvent) return;

    try {
      setIsLoading(true);
      
      let requestBody: any = { eventId: selectedEvent.id };
      
      if (operation === 'clear') {
        requestBody.action = 'clear';
      } else if (operation === 'copy') {
        requestBody = {
          action: 'copy',
          sourceEventId: data.sourceEventId,
          targetEventId: selectedEvent.id,
          userIds: data.userIds
        };
      }

      const response = await fetch('/api/admin/bulk-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        addNotification({
          type: 'success',
          title: 'Operazione completata',
          message: result.message
        });
        // Reload predictions
        loadPredictionsForEvent(selectedEvent.id);
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Errore nell\'operazione',
          message: error.error || 'Impossibile completare l\'operazione'
        });
      }
    } catch (error) {
      console.error('Errore nell\'operazione bulk:', error);
      addNotification({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Impossibile connettersi al server'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = usersWithPredictions.filter(item =>
    !searchTerm || 
    item.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
      <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          📊 Gestione Bulk Pronostici
        </h1>
        <p className="text-muted-foreground">
          Modifica rapidamente i pronostici di tutti gli utenti per qualsiasi gara.
          Ottimizzato per l'inserimento rapido di dati storici.
        </p>
        </div>
      </Card>

      {/* Event Selection */}
      <Card>
        <div className="p-6">
        <EventSelector
          events={events}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
          hasUnsavedChanges={hasUnsavedChanges}
        />
        </div>
      </Card>

      {selectedEvent && (
        <>
          {/* Controls */}
          <Card>
            <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <UserSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                totalUsers={usersWithPredictions.length}
                filteredUsers={filteredUsers.length}
              />
              
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    onClick={handleBulkSave}
                    disabled={!hasUnsavedChanges || isLoading}
                    isLoading={isLoading}
                  >
                    Salva Tutto
                  </Button>

                  {saveProgress && (
                    <div className="absolute top-full left-0 right-0 mt-2">
                      <div className="bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(saveProgress.current / saveProgress.total) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        {Math.round((saveProgress.current / saveProgress.total) * 100)}%
                      </div>
                    </div>
                  )}
                </div>
                
                <BulkOperations
                  selectedEvent={selectedEvent}
                  events={events}
                  onBulkOperation={handleBulkOperation}
                  isLoading={isLoading}
                />
              </div>
            </div>
            </div>
          </Card>

          {/* Predictions Grid */}
          <div className="bg-card text-card-foreground border border-border shadow rounded-lg">
            <BulkPredictionsGrid
              users={filteredUsers}
              drivers={drivers}
              onPredictionChange={handlePredictionChange}
              isLoading={isLoading}
              hasUnsavedChanges={hasUnsavedChanges}
              scoringType={(selectedEvent as any)?.season?.scoringType}
            />
          </div>
        </>
      )}
      </div>
    </>
  );
}
