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
        className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
      >
        Operazioni Bulk
        <ChevronDownIcon className="ml-2 -mr-1 h-4 w-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card text-card-foreground border border-border z-10">
          <div className="py-1">
            <button
              onClick={() => {
                setShowCopyDialog(true);
                setIsOpen(false);
              }}
              disabled={isLoading || availableSourceEvents.length === 0}
              className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📋 Copia da altra gara
            </button>
            
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Cancella tutti i pronostici
            </button>
          </div>
        </div>
      )}

      {/* Copy Dialog */}
      {showCopyDialog && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border w-96 shadow-lg rounded-md bg-card text-card-foreground">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Copia Pronostici
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Gara di destinazione:
                </label>
                <div className="p-3 bg-muted rounded-md text-sm border border-border">
                  <strong>{selectedEvent.name}</strong>
                  <div className="text-muted-foreground">
                    {formatDate(selectedEvent.date)} • {selectedEvent._count.predictions} pronostici esistenti
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Copia da:
                </label>
                {availableSourceEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Nessuna gara con pronostici disponibile per la copia.
                  </p>
                ) : (
                  <select
                    value={copySourceEventId}
                    onChange={(e) => setCopySourceEventId(e.target.value)}
                    className="w-full p-2 border border-border bg-input text-foreground rounded-md focus:ring-primary focus:border-primary"
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
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Copiando...' : 'Copia Pronostici'}
                </button>
                
                <button
                  onClick={() => {
                    setShowCopyDialog(false);
                    setCopySourceEventId('');
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 border border-border rounded-md text-secondary-foreground bg-secondary hover:bg-secondary/80 disabled:opacity-50"
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
