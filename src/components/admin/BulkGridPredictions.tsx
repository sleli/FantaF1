'use client';

import { useState, useCallback } from 'react';
import { Driver } from '@prisma/client';
import SortableDriverList from '@/components/predictions/SortableDriverList';
import Button from '@/components/ui/Button';

type UserWithPrediction = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  prediction: {
    id: string;
    rankings?: string[];
    [key: string]: any;
  } | null;
};

interface BulkGridPredictionsProps {
  users: UserWithPrediction[];
  drivers: Driver[];
  eventId: string;
  isLoading: boolean;
  onSaveSuccess: () => void;
  addNotification: (n: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void;
}

export default function BulkGridPredictions({
  users,
  drivers,
  eventId,
  isLoading,
  onSaveSuccess,
  addNotification,
}: BulkGridPredictionsProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [orderedDriverIds, setOrderedDriverIds] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const defaultOrder = drivers
    .sort((a, b) => a.number - b.number)
    .map((d) => d.id);

  const selectUser = useCallback(
    (userId: string) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'Hai modifiche non salvate. Vuoi continuare e perdere le modifiche?'
        );
        if (!confirmed) return;
      }

      setSelectedUserId(userId);
      const userItem = users.find((u) => u.user.id === userId);
      const rankings = userItem?.prediction?.rankings;

      if (rankings && Array.isArray(rankings) && rankings.length > 0) {
        // Use existing rankings, but ensure all drivers are included
        const existingSet = new Set(rankings);
        const missingDrivers = defaultOrder.filter((id) => !existingSet.has(id));
        setOrderedDriverIds([...rankings, ...missingDrivers]);
      } else {
        setOrderedDriverIds([...defaultOrder]);
      }
      setHasUnsavedChanges(false);
    },
    [users, hasUnsavedChanges, defaultOrder]
  );

  const handleOrderChange = useCallback((newOrder: string[]) => {
    setOrderedDriverIds(newOrder);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    if (!selectedUserId) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/bulk-predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-grid',
          eventId,
          userId: selectedUserId,
          rankings: orderedDriverIds,
        }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Griglia salvata',
          message: `Pronostico salvato per ${users.find((u) => u.user.id === selectedUserId)?.user.name || 'utente'}`,
        });
        setHasUnsavedChanges(false);
        onSaveSuccess();
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Errore nel salvataggio',
          message: error.error || 'Impossibile salvare la griglia',
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Impossibile connettersi al server',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getUserStatus = (userItem: UserWithPrediction): 'complete' | 'empty' => {
    const rankings = userItem.prediction?.rankings;
    return rankings && Array.isArray(rankings) && rankings.length > 0
      ? 'complete'
      : 'empty';
  };

  const completeCount = users.filter((u) => getUserStatus(u) === 'complete').length;
  const emptyCount = users.filter((u) => getUserStatus(u) === 'empty').length;

  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Nessun utente trovato.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="bg-muted border-b border-border p-4">
        <h3 className="text-lg font-medium text-foreground">
          Griglia Completa - Full Grid ({users.length} utenti)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Seleziona un utente per modificare la sua griglia con drag-and-drop.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[500px]">
        {/* User list (left panel) */}
        <div className="lg:w-80 lg:border-r border-b lg:border-b-0 border-border overflow-y-auto max-h-[600px]">
          {users.map((userItem) => {
            const status = getUserStatus(userItem);
            const isSelected = selectedUserId === userItem.user.id;

            return (
              <button
                key={userItem.user.id}
                onClick={() => selectUser(userItem.user.id)}
                disabled={isLoading || isSaving}
                className={`
                  w-full text-left px-4 py-3 border-b border-border transition-colors
                  disabled:opacity-50
                  ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {userItem.user.name || 'Nome non disponibile'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {userItem.user.email}
                    </div>
                  </div>
                  <span className="ml-2 flex-shrink-0">
                    {status === 'complete' ? (
                      <span className="text-green-500 text-sm">✅</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">⭕</span>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Grid panel (right) */}
        <div className="flex-1 overflow-y-auto max-h-[600px]">
          {selectedUserId ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-foreground">
                  {users.find((u) => u.user.id === selectedUserId)?.user.name}
                </h4>
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  isLoading={isSaving}
                >
                  Salva Griglia
                </Button>
              </div>

              {hasUnsavedChanges && (
                <div className="text-sm text-orange-500 font-medium mb-3">
                  Modifiche non salvate
                </div>
              )}

              <SortableDriverList
                drivers={drivers}
                orderedDriverIds={orderedDriverIds}
                onChange={handleOrderChange}
                disabled={isSaving}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground p-8">
              <p>Seleziona un utente dalla lista per modificare la sua griglia.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with stats */}
      <div className="bg-muted border-t border-border p-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>✅ Completi: {completeCount}</span>
          <span>⭕ Vuoti: {emptyCount}</span>
        </div>
      </div>
    </div>
  );
}
