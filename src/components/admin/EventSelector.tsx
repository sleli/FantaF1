'use client';

import { Driver, Event } from '@prisma/client';

type EventWithCount = Event & {
  firstPlace?: Driver;
  secondPlace?: Driver;
  thirdPlace?: Driver;
  _count: { predictions: number };
};

interface EventSelectorProps {
  events: EventWithCount[];
  selectedEvent: EventWithCount | null;
  onEventSelect: (event: EventWithCount) => void;
  hasUnsavedChanges: boolean;
}

export default function EventSelector({
  events,
  selectedEvent,
  onEventSelect,
  hasUnsavedChanges
}: EventSelectorProps) {
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (event: EventWithCount) => {
    switch (event.status) {
      case 'UPCOMING':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Prossimo</span>;
      case 'CLOSED':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Chiuso</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completato</span>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'RACE' ? '🏁' : '⚡';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Seleziona Gara
        </h2>
        {hasUnsavedChanges && (
          <span className="text-sm text-orange-600 font-medium">
            ⚠️ Hai modifiche non salvate
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nessuna gara disponibile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventSelect(event)}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                ${selectedEvent?.id === event.id 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(event.type)}</span>
                  <span className="text-sm font-medium text-gray-600">
                    {event.type}
                  </span>
                </div>
                {getStatusBadge(event)}
              </div>

              {/* Event Name */}
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {event.name}
              </h3>

              {/* Date */}
              <p className="text-sm text-gray-600 mb-2">
                📅 {formatDate(event.date)}
              </p>

              {/* Predictions Count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Pronostici: {event._count.predictions}
                </span>
                {selectedEvent?.id === event.id && (
                  <span className="text-red-600 font-medium">
                    Selezionato
                  </span>
                )}
              </div>

              {/* Results (if completed) */}
              {event.status === 'COMPLETED' && event.firstPlace && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>🥇 {event.firstPlace.name}</div>
                    {event.secondPlace && <div>🥈 {event.secondPlace.name}</div>}
                    {event.thirdPlace && <div>🥉 {event.thirdPlace.name}</div>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedEvent && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            Gara Selezionata: {selectedEvent.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <span className="font-medium">Tipo:</span> {selectedEvent.type}
            </div>
            <div>
              <span className="font-medium">Data:</span> {formatDate(selectedEvent.date)}
            </div>
            <div>
              <span className="font-medium">Pronostici:</span> {selectedEvent._count.predictions}
            </div>
          </div>
          {selectedEvent.status === 'COMPLETED' && selectedEvent.firstPlace && (
            <div className="mt-3 pt-3 border-t border-blue-300">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Risultati:</span>
                <div className="mt-1 flex flex-wrap gap-4">
                  <span>🥇 {selectedEvent.firstPlace.name}</span>
                  {selectedEvent.secondPlace && <span>🥈 {selectedEvent.secondPlace.name}</span>}
                  {selectedEvent.thirdPlace && <span>🥉 {selectedEvent.thirdPlace.name}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
