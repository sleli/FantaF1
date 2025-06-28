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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Evento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chiusura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pronostici
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <React.Fragment key={event.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => setExpandedEvent(
                          expandedEvent === event.id ? null : event.id
                        )}
                        className="mr-2 text-gray-400 hover:text-gray-600"
                      >
                        {expandedEvent === event.id ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {event.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(event.date)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(event.closingDate)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(event.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="font-medium">{event._count.predictions}</span>
                      {event._count.predictions > 0 && (
                        <span className="ml-1 text-gray-500">pronostici</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Status Update */}
                      {event.status !== 'COMPLETED' && (
                        <select
                          value={event.status}
                          onChange={(e) => handleStatusUpdate(event.id, e.target.value)}
                          disabled={updatingStatus === event.id}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="UPCOMING">In Arrivo</option>
                          <option value="CLOSED">Chiuso</option>
                          <option value="COMPLETED">Completato</option>
                        </select>
                      )}
                      
                      {/* Edit */}
                      {canEdit(event) && (
                        <button
                          onClick={() => onEdit(event)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Modifica evento"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Delete */}
                      {canDelete(event) && (
                        <button
                          onClick={() => onDelete(event.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Elimina evento"
                        >
                          <TrashIcon className="h-4 w-4" />
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
