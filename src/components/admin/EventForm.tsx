'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Driver {
  id: string;
  name: string;
  team: string;
  number: number;
  active: boolean;
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
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'results'>('basic');

  const isEditing = !!event;
  const isCompleted = event?.status === 'COMPLETED';
  const hasResults = event?.firstPlace || event?.secondPlace || event?.thirdPlace;
  const hasPredictions = (event?._count?.predictions || 0) > 0;

  // Carica dati iniziali
  useEffect(() => {
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
      
      // Se l'evento ha risultati, mostra il tab risultati
      if (hasResults) {
        setActiveTab('results');
      }
    } else {
      // Default per nuovo evento: chiusura 1 ora prima dell'evento
      const now = new Date();
      const eventTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h
      const closingTime = new Date(eventTime.getTime() - 60 * 60 * 1000); // -1h
      
      setFormData(prev => ({
        ...prev,
        date: eventTime.toISOString().slice(0, 16),
        closingDate: closingTime.toISOString().slice(0, 16)
      }));
    }
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
        setDrivers(data.drivers.filter((d: Driver) => d.active));
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
        if (formData.firstPlaceId) submitData.firstPlaceId = formData.firstPlaceId;
        if (formData.secondPlaceId) submitData.secondPlaceId = formData.secondPlaceId;
        if (formData.thirdPlaceId) submitData.thirdPlaceId = formData.thirdPlaceId;
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
    
    // Auto-calcolo data chiusura quando cambia data evento
    if (field === 'date' && value && !isEditing) {
      const eventDate = new Date(value);
      const closingDate = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1 ora prima
      setFormData(prev => ({
        ...prev,
        closingDate: closingDate.toISOString().slice(0, 16)
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
      const now = new Date();
      
      if (eventDate <= now) return 'La data dell\'evento deve essere futura';
      if (closingDate >= eventDate) return 'La data di chiusura deve essere prima dell\'evento';
      if (closingDate <= now) return 'La data di chiusura deve essere futura';
    } else {
      // Validazione risultati
      const positions = [formData.firstPlaceId, formData.secondPlaceId, formData.thirdPlaceId]
        .filter(Boolean);
      
      if (positions.length === 0) return 'Inserisci almeno un risultato';
      if (new Set(positions).size !== positions.length) {
        return 'Lo stesso pilota non può occupare più posizioni';
      }
    }
    
    return null;
  };

  const canEditBasic = !isEditing || (!isCompleted && !hasPredictions);
  const canEditResults = isEditing && event?.status !== 'UPCOMING';
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
                disabled={event?.status === 'UPCOMING'}
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
                  disabled={!canEditBasic}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="es. Gran Premio di Monaco"
                  maxLength={100}
                />
                {!canEditBasic && (
                  <p className="mt-1 text-xs text-gray-500">
                    Non modificabile: evento completato o con pronostici esistenti
                  </p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Evento *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  disabled={!canEditBasic}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
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
                    disabled={!canEditBasic}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
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
                    disabled={!canEditBasic}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Info Predizioni */}
              {isEditing && hasPredictions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Attenzione:</strong> Questo evento ha già {event?._count?.predictions} pronostici.
                    Le modifiche a tipo e date sono bloccate per mantenere l'integrità dei dati.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Inserisci i risultati ufficiali dell'evento. Questo cambierà automaticamente 
                  lo stato dell'evento a "Completato" e attiverà il calcolo dei punteggi.
                </p>
              </div>

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
