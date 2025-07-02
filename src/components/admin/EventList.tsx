import React, { useState } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Driver } from '@prisma/client';
import { EventWithResults } from '@/lib/types';

// Tipo per eventi con conteggio pronostici per la lista admin
type EventListItem = EventWithResults & {
  _count: { predictions: number };
};

interface EventListProps {
  events: EventListItem[];
  onEdit: (event: EventListItem) => void;
  onDelete: (eventId: string) => void;
  onRefresh: () => void;
}

export default function EventList({ events, onEdit, onDelete, onRefresh }: EventListProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    // Mostra la data UTC esattamente come salvata nel DB
    return date.toISOString().slice(0, 16).replace('T', ' ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'CLOSED':
        return <XCircleIcon className="h-5 w-5 text-orange-500" />;
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <CalendarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'In Arrivo';
      case 'CLOSED':
        return 'Chiuso';
      case 'COMPLETED':
        return 'Completato';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'RACE' 
      ? 'bg-red-100 text-red-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const handleStatusUpdate = async (eventId: string, newStatus: string) => {
    if (!confirm(`Cambiare lo stato dell'evento a "${getStatusText(newStatus)}"?`)) {
      return;
    }

    try {
      setUpdatingStatus(eventId);
      
      console.log(`Updating event ${eventId} status to:`, newStatus);
      
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (error) {
        console.error('Error parsing response JSON:', error);
        throw new Error('Errore nella risposta del server');
      }
      
      if (!response.ok) {
        console.error('Error response from server:', responseData);
        throw new Error(responseData.error || 'Errore nell\'aggiornamento');
      }

      console.log('Status update successful:', responseData);
      onRefresh();
    } catch (error) {
      console.error('Status update failed:', error);
      alert(error instanceof Error ? error.message : 'Errore nell\'aggiornamento');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const canDelete = (event: EventListItem) => {
    return event._count.predictions === 0;
  };

  const canEdit = (event: EventListItem) => {
    return true; // Sempre modificabile, ma con limitazioni nel form
  };

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nessun evento trovato
        </h3>
        <p className="text-gray-500">
          Inizia creando il primo evento del campionato
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(event.status)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
                    <p className="text-sm text-gray-500">
                      {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'} • {event._count.predictions} pronostici
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-target"
                  aria-label="Toggle details"
                >
                  {expandedEvent === event.id ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Data Evento:</span>
                  <p className="font-medium">{formatDate(event.date)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Chiusura:</span>
                  <p className="font-medium">{formatDate(event.closingDate)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="font-medium">{getStatusText(event.status)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Pronostici:</span>
                  <p className="font-medium">{event._count.predictions}</p>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedEvent === event.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Creato il:</span>
                      <p className="font-medium">{formatDate(event.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Ultima modifica:</span>
                      <p className="font-medium">{formatDate(event.updatedAt)}</p>
                    </div>
                    {!canDelete(event) && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚠️ Non eliminabile: evento con pronostici esistenti
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => onEdit(event)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 touch-button"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Modifica
                </button>
                <button
                  onClick={() => onDelete(event.id)}
                  disabled={!canDelete(event)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed touch-button"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Elimina
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/4 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Evento
              </th>
              <th className="w-16 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Tipo
              </th>
              <th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Data
              </th>
              <th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Chiusura
              </th>
              <th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="w-16 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pred.
              </th>
              <th className="w-24 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <React.Fragment key={event.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => setExpandedEvent(
                          expandedEvent === event.id ? null : event.id
                        )}
                        className="mr-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        {expandedEvent === event.id ? (
                          <ChevronUpIcon className="h-3 w-3" />
                        ) : (
                          <ChevronDownIcon className="h-3 w-3" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate" title={event.name}>
                          {event.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {event.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${getTypeColor(event.type)}`}>
                      {event.type === 'RACE' ? 'GP' : 'SP'}
                    </span>
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900">
                    <div className="truncate" title={formatDate(event.date)}>
                      {new Date(event.date).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900">
                    <div className="truncate" title={formatDate(event.closingDate)}>
                      {new Date(event.closingDate).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap">
                    {event.status !== 'COMPLETED' ? (
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusUpdate(event.id, e.target.value)}
                        disabled={updatingStatus === event.id}
                        className="text-xs border border-gray-300 rounded px-1 py-0.5 w-full focus:ring-1 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="UPCOMING">In Arrivo</option>
                        <option value="CLOSED">Chiuso</option>
                        <option value="COMPLETED">Completato</option>
                      </select>
                    ) : (
                      <div className="flex items-center justify-center">
                        {getStatusIcon(event.status)}
                        <span className={`ml-1 inline-flex px-1 py-0.5 text-xs font-semibold rounded ${getStatusColor(event.status)}`}>
                          Comp.
                        </span>
                      </div>
                    )}
                  </td>
                  
                  <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    <span className="font-medium">{event._count.predictions}</span>
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Edit */}
                      {canEdit(event) && (
                        <button
                          onClick={() => onEdit(event)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-1 focus:ring-red-500"
                          title="Modifica evento"
                        >
                          <span className="mr-1">✏️</span>
                          Edit
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete(event) && (
                        <button
                          onClick={() => onDelete(event.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Elimina evento"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Row */}
                {expandedEvent === event.id && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Risultati */}
                        {event.status === 'COMPLETED' && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">🏆 Risultati Ufficiali</h4>
                            <div className="space-y-2">
                              {event.firstPlace && (
                                <div className="flex items-center text-sm">
                                  <span className="text-yellow-500 mr-2">🥇</span>
                                  <span>#{event.firstPlace.number} {event.firstPlace.name} ({event.firstPlace.team})</span>
                                </div>
                              )}
                              {event.secondPlace && (
                                <div className="flex items-center text-sm">
                                  <span className="text-gray-400 mr-2">🥈</span>
                                  <span>#{event.secondPlace.number} {event.secondPlace.name} ({event.secondPlace.team})</span>
                                </div>
                              )}
                              {event.thirdPlace && (
                                <div className="flex items-center text-sm">
                                  <span className="text-amber-600 mr-2">🥉</span>
                                  <span>#{event.thirdPlace.number} {event.thirdPlace.name} ({event.thirdPlace.team})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Info Aggiuntive */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">📊 Statistiche</h4>
                          <div className="space-y-1 text-sm">
                            <div>Pronostici ricevuti: <span className="font-medium">{event._count.predictions}</span></div>
                            <div>Creato il: <span className="font-medium">{formatDate(event.createdAt)}</span></div>
                            <div>Ultima modifica: <span className="font-medium">{formatDate(event.updatedAt)}</span></div>
                          </div>
                          
                          {/* Warning per eliminazione */}
                          {!canDelete(event) && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                              ⚠️ Non eliminabile: evento con pronostici esistenti
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
