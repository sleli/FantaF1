'use client';

import { useState } from 'react';
import { Driver, Event } from '@prisma/client';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type EventWithCount = Event & {
  firstPlace?: Driver;
  secondPlace?: Driver;
  thirdPlace?: Driver;
  _count: { predictions: number };
};

interface BulkOperationsProps {
  selectedEvent: EventWithCount;
  events: EventWithCount[];
  onBulkOperation: (operation: string, data?: any) => void;
  isLoading: boolean;
}

export default function BulkOperations({
  selectedEvent,
  events,
  onBulkOperation,
  isLoading
}: BulkOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySourceEventId, setCopySourceEventId] = useState('');

  const handleClearAll = () => {
    const confirmed = window.confirm(
      `⚠️ ATTENZIONE: Stai per cancellare TUTTI i ${selectedEvent._count.predictions} pronostici per "${selectedEvent.name}".\n\nQuesta azione NON PUÒ essere annullata.\n\nSei sicuro di voler continuare?`
    );

    if (confirmed) {
      const doubleConfirm = window.confirm(
        `Ultima conferma: cancellare definitivamente tutti i pronostici per "${selectedEvent.name}"?`
      );

      if (doubleConfirm) {
        onBulkOperation('clear');
        setIsOpen(false);
      }
    }
  };

  const handleCopyPredictions = () => {
    if (!copySourceEventId) {
      alert('Seleziona una gara sorgente');
      return;
    }

    const sourceEvent = events.find(e => e.id === copySourceEventId);
    if (!sourceEvent) {
      alert('Gara sorgente non trovata');
      return;
    }

    const confirmed = window.confirm(
      `📋 Stai per copiare ${sourceEvent._count.predictions} pronostici da:\n"${sourceEvent.name}"\n\nVERSO:\n"${selectedEvent.name}"\n\n⚠️ I pronostici esistenti (${selectedEvent._count.predictions}) verranno SOVRASCRITTI.\n\nContinuare?`
    );

    if (confirmed) {
      onBulkOperation('copy', {
        sourceEventId: copySourceEventId,
        userIds: undefined // Copy all users
      });
      setShowCopyDialog(false);
      setIsOpen(false);
      setCopySourceEventId('');
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter events that have predictions and are not the current event
  const availableSourceEvents = events.filter(
    e => e.id !== selectedEvent.id && e._count.predictions > 0
  );

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
      >
        Operazioni Bulk
        <ChevronDownIcon className="ml-2 -mr-1 h-4 w-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button
              onClick={() => {
                setShowCopyDialog(true);
                setIsOpen(false);
              }}
              disabled={isLoading || availableSourceEvents.length === 0}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📋 Copia da altra gara
            </button>
            
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Cancella tutti i pronostici
            </button>
          </div>
        </div>
      )}

      {/* Copy Dialog */}
      {showCopyDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Copia Pronostici
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gara di destinazione:
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  <strong>{selectedEvent.name}</strong>
                  <div className="text-gray-600">
                    {formatDate(selectedEvent.date)} • {selectedEvent._count.predictions} pronostici esistenti
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Copia da:
                </label>
                {availableSourceEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Nessuna gara con pronostici disponibile per la copia.
                  </p>
                ) : (
                  <select
                    value={copySourceEventId}
                    onChange={(e) => setCopySourceEventId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Seleziona gara sorgente...</option>
                    {availableSourceEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} ({formatDate(event.date)}) - {event._count.predictions} pronostici
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyPredictions}
                  disabled={!copySourceEventId || isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Copiando...' : 'Copia Pronostici'}
                </button>
                
                <button
                  onClick={() => {
                    setShowCopyDialog(false);
                    setCopySourceEventId('');
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
