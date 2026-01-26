'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import SortableDriverList from '../predictions/SortableDriverList';
import type { Driver } from '@prisma/client';
import Badge from '@/components/ui/Badge';

interface Season {
  id: string;
  scoringType: 'LEGACY_TOP3' | 'FULL_GRID_DIFF';
}

interface Event {
  id: string;
  name: string;
  type: 'RACE' | 'SPRINT';
  date: Date;
  closingDate: Date;
  status: 'UPCOMING' | 'CLOSED' | 'COMPLETED';
  sessionKey?: number | null; // OpenF1 session key for fetching results
  firstPlace?: Driver;
  secondPlace?: Driver;
  thirdPlace?: Driver;
  results?: any; // Array di driver IDs (Json from Prisma)
  season?: Season;
  _count: { predictions: number };
  createdAt: Date;
  updatedAt: Date;
}

interface FetchedResultItem {
  position: number;
  driverNumber: number;
  driverId: string | null;
  driverName: string;
  driverTeam?: string | null;
}

interface EventFormProps {
  event?: Event | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'RACE' as 'RACE' | 'SPRINT',
    date: '',
    closingDate: '',
    firstPlaceId: '',
    secondPlaceId: '',
    thirdPlaceId: ''
  });
  const [results, setResults] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [scoringType, setScoringType] = useState<'LEGACY_TOP3' | 'FULL_GRID_DIFF'>('LEGACY_TOP3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'results'>('basic');

  // Fetch results from F1 API state
  const [fetchingResults, setFetchingResults] = useState(false);
  const [fetchedResults, setFetchedResults] = useState<FetchedResultItem[]>([]);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);

  const isEditing = !!event;
  // Check if has results based on scoring type logic later, or just check existence
  const hasResults = (event?.results && event.results.length > 0) || 
                     event?.firstPlace || event?.secondPlace || event?.thirdPlace;
  const hasPredictions = (event?._count?.predictions || 0) > 0;

  // Carica dati iniziali
  useEffect(() => {
    const initData = async () => {
      // Determine scoring type
      let currentScoringType: 'LEGACY_TOP3' | 'FULL_GRID_DIFF' = 'LEGACY_TOP3';
      
      if (event?.season) {
        currentScoringType = event.season.scoringType;
      } else {
        // Fetch active season if new event or missing season info
        try {
          const res = await fetch('/api/seasons?active=true');
          if (res.ok) {
            const data = await res.json();
            const activeSeason = data.seasons?.find((s: any) => s.isActive);
            if (activeSeason) {
              currentScoringType = activeSeason.scoringType;
            }
          }
        } catch (e) {
          console.error('Error fetching active season:', e);
        }
      }
      setScoringType(currentScoringType);

      if (event) {
        const eventDate = new Date(event.date);
        const closingDate = new Date(event.closingDate);
        
        setFormData({
          name: event.name,
          type: event.type,
          date: eventDate.toISOString().slice(0, 16),
          closingDate: closingDate.toISOString().slice(0, 16),
          firstPlaceId: event.firstPlace?.id || '',
          secondPlaceId: event.secondPlace?.id || '',
          thirdPlaceId: event.thirdPlace?.id || ''
        });

        if (event.results && Array.isArray(event.results)) {
          setResults(event.results);
        }
        
        // Se l'evento ha risultati, mostra il tab risultati
        if (hasResults) {
          setActiveTab('results');
        }
      } else {
        // Default per nuovo evento: chiusura 1 ora prima dell'evento (tutto in UTC)
        const nowUTC = new Date();
        const eventTimeUTC = new Date(nowUTC.getTime() + 24 * 60 * 60 * 1000); // +24h UTC
        const closingTimeUTC = new Date(eventTimeUTC.getTime() - 60 * 60 * 1000); // -1h UTC

        setFormData(prev => ({
          ...prev,
          date: eventTimeUTC.toISOString().slice(0, 16),
          closingDate: closingTimeUTC.toISOString().slice(0, 16)
        }));
      }
    };

    initData();
  }, [event, hasResults]);

  // Carica piloti per i risultati
  useEffect(() => {
    if (activeTab === 'results') {
      fetchDrivers();
    }
  }, [activeTab]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      if (response.ok) {
        const data = await response.json();
        const activeDrivers = data.drivers.filter((d: Driver) => d.active);
        setDrivers(activeDrivers);
        
        // Initialize results for full grid if empty
        if (scoringType === 'FULL_GRID_DIFF' && results.length === 0) {
           // Default order: number order or name order? 
           // Usually we want the user to order them. 
           // If we have no results yet, maybe just list them in default order.
           // However, if we are editing and have no results, we should populate.
           // If we are creating/editing and have results, we use them.
           if (!event?.results || event.results.length === 0) {
             setResults(activeDrivers.map((d: Driver) => d.id));
           }
        }
      }
    } catch (err) {
      console.error('Errore nel caricamento piloti:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData: any = {};
      
      if (activeTab === 'basic') {
        submitData.name = formData.name;
        submitData.type = formData.type;
        submitData.date = new Date(formData.date).toISOString();
        submitData.closingDate = new Date(formData.closingDate).toISOString();
      } else {
        // Tab risultati
        if (scoringType === 'FULL_GRID_DIFF') {
           submitData.results = results;
        } else {
           if (formData.firstPlaceId) submitData.firstPlaceId = formData.firstPlaceId;
           if (formData.secondPlaceId) submitData.secondPlaceId = formData.secondPlaceId;
           if (formData.thirdPlaceId) submitData.thirdPlaceId = formData.thirdPlaceId;
        }
      }

      const url = isEditing ? `/api/admin/events/${event.id}` : '/api/admin/events';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Errore nel salvataggio');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calcolo data chiusura quando cambia data evento (mantieni UTC)
    if (field === 'date' && value && !isEditing) {
      const eventDateUTC = new Date(value);
      const closingDateUTC = new Date(eventDateUTC.getTime() - 60 * 60 * 1000); // 1 ora prima UTC
      setFormData(prev => ({
        ...prev,
        closingDate: closingDateUTC.toISOString().slice(0, 16)
      }));
    }
  };

  const validateForm = () => {
    if (activeTab === 'basic') {
      if (!formData.name.trim()) return 'Il nome è obbligatorio';
      if (!formData.date) return 'La data è obbligatoria';
      if (!formData.closingDate) return 'La data di chiusura è obbligatoria';

      const eventDate = new Date(formData.date);
      const closingDate = new Date(formData.closingDate);

      // For new events, still require future dates. For editing, allow any dates.
      if (!isEditing) {
        const now = new Date();
        if (eventDate <= now) return 'La data dell\'evento deve essere futura';
        if (closingDate <= now) return 'La data di chiusura deve essere futura';
      }

      // Always validate that closing date is before event date
      if (closingDate >= eventDate) return 'La data di chiusura deve essere prima dell\'evento';
    } else {
      // Validazione risultati
      if (scoringType === 'FULL_GRID_DIFF') {
        if (results.length === 0) return 'La griglia non può essere vuota';
        // Check duplicates? Sortable list handles order, uniqueness is guaranteed if source is unique
      } else {
        const positions = [formData.firstPlaceId, formData.secondPlaceId, formData.thirdPlaceId]
          .filter(Boolean);
        
        if (positions.length === 0) return 'Inserisci almeno un risultato';
        if (new Set(positions).size !== positions.length) {
          return 'Lo stesso pilota non può occupare più posizioni';
        }
      }
    }
    
    return null;
  };


  // Fetch results from OpenF1 API
  const handleFetchResults = async () => {
    if (!event?.sessionKey) return;

    setFetchingResults(true);
    setFetchMessage(null);
    setFetchedResults([]);

    try {
      const res = await fetch(`/api/admin/events/${event.id}/fetch-results`, {
        method: 'POST'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore nel recupero risultati');
      }

      if (data.results && data.results.length > 0) {
        setFetchedResults(data.results);
        setFetchMessage(data.message);

        // Auto-populate results
        if (scoringType === 'FULL_GRID_DIFF') {
          const driverIds = data.results
            .filter((r: FetchedResultItem) => r.driverId)
            .map((r: FetchedResultItem) => r.driverId);
          setResults(driverIds);
        } else {
          // Legacy TOP3
          if (data.results[0]?.driverId) {
            setFormData(prev => ({ ...prev, firstPlaceId: data.results[0].driverId }));
          }
          if (data.results[1]?.driverId) {
            setFormData(prev => ({ ...prev, secondPlaceId: data.results[1].driverId }));
          }
          if (data.results[2]?.driverId) {
            setFormData(prev => ({ ...prev, thirdPlaceId: data.results[2].driverId }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      setFetchMessage(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setFetchingResults(false);
    }
  };

  const formError = validateForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? 'Modifica Evento' : 'Nuovo Evento'}
          </h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        {isEditing && (
          <div className="border-b border-border">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'basic'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Dati Base
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'results'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Risultati
                {hasResults && (
                  <span className="ml-2">
                    <Badge variant="success">Inseriti</Badge>
                  </span>
                )}
              </button>
            </nav>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Nome Evento *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="es. Gran Premio di Monaco"
                  maxLength={100}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Tipo Evento *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="RACE">Gara</option>
                  <option value="SPRINT">Sprint</option>
                </select>
              </div>

              {/* Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Data Evento *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Chiusura Pronostici *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.closingDate}
                    onChange={(e) => handleInputChange('closingDate', e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Info Predizioni */}
              {isEditing && hasPredictions && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-primary">
                    <strong>Informazione:</strong> Questo evento ha già {event?._count?.predictions} pronostici.
                    Le modifiche sono ora consentite per tutti gli eventi.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* Fetch from OpenF1 Button */}
              {event?.sessionKey && (
                <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <CloudArrowDownIcon className="h-5 w-5 text-f1-red" />
                        Recupera da OpenF1
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Session Key: {event.sessionKey}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFetchResults}
                      disabled={fetchingResults}
                      className="px-4 py-2 text-sm font-medium bg-f1-red text-white hover:bg-f1-red/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition-colors flex items-center gap-2"
                    >
                      {fetchingResults ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Caricamento...
                        </>
                      ) : (
                        <>
                          <CloudArrowDownIcon className="h-4 w-4" />
                          Recupera Risultati
                        </>
                      )}
                    </button>
                  </div>

                  {fetchMessage && (
                    <p className={`text-xs mt-3 ${
                      fetchedResults.length > 0 ? 'text-green-500' : 'text-destructive'
                    }`}>
                      {fetchMessage}
                    </p>
                  )}

                  {fetchedResults.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Anteprima Top 5:</p>
                      <div className="space-y-1">
                        {fetchedResults.slice(0, 5).map((r, i) => (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <span className="w-6 text-right font-medium text-muted-foreground">P{r.position}</span>
                            <span className={r.driverId ? 'text-foreground' : 'text-destructive'}>
                              {r.driverName}
                            </span>
                          </div>
                        ))}
                        {fetchedResults.length > 5 && (
                          <p className="text-xs text-muted-foreground ml-8">
                            ...e altri {fetchedResults.length - 5} piloti
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary">
                  {scoringType === 'FULL_GRID_DIFF'
                    ? 'Ordina la griglia di arrivo completa. Il primo pilota in alto è il vincitore.'
                    : 'Inserisci i risultati ufficiali dell\'evento.'}
                  {' '}Questo cambierà automaticamente lo stato dell'evento a "Completato" e attiverà il calcolo dei punteggi.
                </p>
              </div>

              {scoringType === 'FULL_GRID_DIFF' ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Ordine di Arrivo Completo</h3>
                  <SortableDriverList 
                    drivers={drivers}
                    orderedDriverIds={results}
                    onChange={setResults}
                  />
                </div>
              ) : (
                <>
                  {/* Primo Posto */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      🥇 Primo Posto
                    </label>
                    <select
                      value={formData.firstPlaceId}
                      onChange={(e) => handleInputChange('firstPlaceId', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Seleziona pilota...</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          #{driver.number} {driver.name} ({driver.team})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Secondo Posto */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      🥈 Secondo Posto
                    </label>
                    <select
                      value={formData.secondPlaceId}
                      onChange={(e) => handleInputChange('secondPlaceId', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Seleziona pilota...</option>
                      {drivers
                        .filter(d => d.id !== formData.firstPlaceId)
                        .map(driver => (
                        <option key={driver.id} value={driver.id}>
                          #{driver.number} {driver.name} ({driver.team})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Terzo Posto */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      🥉 Terzo Posto
                    </label>
                    <select
                      value={formData.thirdPlaceId}
                      onChange={(e) => handleInputChange('thirdPlaceId', e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Seleziona pilota...</option>
                      {drivers
                        .filter(d => d.id !== formData.firstPlaceId && d.id !== formData.secondPlaceId)
                        .map(driver => (
                        <option key={driver.id} value={driver.id}>
                          #{driver.number} {driver.name} ({driver.team})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !!formError}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading ? 'Salvando...' : (isEditing ? 'Aggiorna' : 'Crea Evento')}
          </button>
        </div>

        {/* Form Validation Error */}
        {formError && (
          <div className="px-6 pb-4">
            <p className="text-sm text-destructive">{formError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
