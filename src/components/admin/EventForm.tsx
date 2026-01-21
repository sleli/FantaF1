'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SortableDriverList from '../predictions/SortableDriverList';
import type { Driver } from '@prisma/client';

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
  firstPlace?: Driver;
  secondPlace?: Driver;
  thirdPlace?: Driver;
  results?: string[]; // Array di driver IDs
  season?: Season;
  _count: { predictions: number };
  createdAt: Date;
  updatedAt: Date;
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


  const formError = validateForm();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Modifica Evento' : 'Nuovo Evento'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        {isEditing && (
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'basic'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Dati Base
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'results'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Risultati
                {hasResults && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Inseriti
                  </span>
                )}
              </button>
            </nav>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Evento *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="es. Gran Premio di Monaco"
                  maxLength={100}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Evento *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="RACE">Gara</option>
                  <option value="SPRINT">Sprint</option>
                </select>
              </div>

              {/* Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Evento *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chiusura Pronostici *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.closingDate}
                    onChange={(e) => handleInputChange('closingDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Info Predizioni */}
              {isEditing && hasPredictions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Informazione:</strong> Questo evento ha già {event?._count?.predictions} pronostici.
                    Le modifiche sono ora consentite per tutti gli eventi.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  {scoringType === 'FULL_GRID_DIFF' 
                    ? 'Ordina la griglia di arrivo completa. Il primo pilota in alto è il vincitore.' 
                    : 'Inserisci i risultati ufficiali dell\'evento.'}
                  {' '}Questo cambierà automaticamente lo stato dell'evento a "Completato" e attiverà il calcolo dei punteggi.
                </p>
              </div>

              {scoringType === 'FULL_GRID_DIFF' ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Ordine di Arrivo Completo</h3>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🥇 Primo Posto
                    </label>
                    <select
                      value={formData.firstPlaceId}
                      onChange={(e) => handleInputChange('firstPlaceId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🥈 Secondo Posto
                    </label>
                    <select
                      value={formData.secondPlaceId}
                      onChange={(e) => handleInputChange('secondPlaceId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🥉 Terzo Posto
                    </label>
                    <select
                      value={formData.thirdPlaceId}
                      onChange={(e) => handleInputChange('thirdPlaceId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !!formError}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading ? 'Salvando...' : (isEditing ? 'Aggiorna' : 'Crea Evento')}
          </button>
        </div>

        {/* Form Validation Error */}
        {formError && (
          <div className="px-6 pb-4">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
