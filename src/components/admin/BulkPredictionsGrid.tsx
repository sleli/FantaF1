'use client';

import { useState, useRef, useCallback, KeyboardEvent, memo } from 'react';
import { Driver, ScoringType } from '@prisma/client';

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

interface BulkPredictionsGridProps {
  users: UserWithPrediction[];
  drivers: Driver[];
  onPredictionChange: (userId: string, field: string, value: string) => void;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  scoringType?: ScoringType;
}

export default memo(function BulkPredictionsGrid({
  users,
  drivers,
  onPredictionChange,
  isLoading,
  hasUnsavedChanges,
  scoringType
}: BulkPredictionsGridProps) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Create refs for all select elements for keyboard navigation
  const selectRefs = useRef<{ [key: string]: HTMLSelectElement | null }>({});

  const setSelectRef = useCallback((key: string, element: HTMLSelectElement | null) => {
    selectRefs.current[key] = element;
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent, rowIndex: number, colIndex: number) => {
    const totalCols = 3; // firstPlace, secondPlace, thirdPlace
    const totalRows = users.length;

    let newRow = rowIndex;
    let newCol = colIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(rowIndex + 1, totalRows - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(rowIndex - 1, 0);
        break;
      case 'ArrowRight':
      case 'Tab':
        if (!e.shiftKey) {
          e.preventDefault();
          newCol = colIndex + 1;
          if (newCol >= totalCols) {
            newCol = 0;
            newRow = Math.min(rowIndex + 1, totalRows - 1);
          }
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = colIndex - 1;
        if (newCol < 0) {
          newCol = totalCols - 1;
          newRow = Math.max(rowIndex - 1, 0);
        }
        break;
      default:
        return;
    }

    // Handle Shift+Tab for reverse navigation
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      newCol = colIndex - 1;
      if (newCol < 0) {
        newCol = totalCols - 1;
        newRow = Math.max(rowIndex - 1, 0);
      }
    }

    // Focus the new cell
    const newKey = `${users[newRow]?.user.id}-${newCol}`;
    const newElement = selectRefs.current[newKey];
    if (newElement) {
      newElement.focus();
      setFocusedCell({ row: newRow, col: newCol });
    }
  }, [users]);

  const getFieldName = (colIndex: number): string => {
    switch (colIndex) {
      case 0: return 'firstPlaceId';
      case 1: return 'secondPlaceId';
      case 2: return 'thirdPlaceId';
      default: return '';
    }
  };

  const getFieldValue = (prediction: any, colIndex: number): string => {
    if (!prediction) return '';
    switch (colIndex) {
      case 0: return prediction.firstPlaceId || '';
      case 1: return prediction.secondPlaceId || '';
      case 2: return prediction.thirdPlaceId || '';
      default: return '';
    }
  };

  const getColumnHeader = (colIndex: number): string => {
    switch (colIndex) {
      case 0: return '🥇 1° Posto';
      case 1: return '🥈 2° Posto';
      case 2: return '🥉 3° Posto';
      default: return '';
    }
  };

  const isValidPrediction = (prediction: any): boolean => {
    if (!prediction) return false;
    const { firstPlaceId, secondPlaceId, thirdPlaceId } = prediction;
    return firstPlaceId && secondPlaceId && thirdPlaceId &&
           firstPlaceId !== secondPlaceId &&
           firstPlaceId !== thirdPlaceId &&
           secondPlaceId !== thirdPlaceId;
  };

  const getRowStatus = (prediction: any): 'complete' | 'partial' | 'empty' | 'invalid' => {
    if (!prediction) return 'empty';
    
    const { firstPlaceId, secondPlaceId, thirdPlaceId } = prediction;
    const filledFields = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(Boolean).length;
    
    if (filledFields === 0) return 'empty';
    if (filledFields === 3) {
      return isValidPrediction(prediction) ? 'complete' : 'invalid';
    }
    return 'partial';
  };

  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Nessun utente trovato.</p>
      </div>
    );
  }

  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    return (
      <div className="p-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            ⚠️ Modalità "Differenza Griglia"
          </h3>
          <p className="text-yellow-700">
            La modifica massiva non è supportata per questa modalità di gioco (Full Grid).
            L'ordinamento completo della griglia deve essere gestito individualmente o tramite interfaccia dedicata.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden" ref={gridRef}>
      {/* Header */}
      <div className="bg-muted border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">
            Griglia Pronostici ({users.length} utenti)
          </h3>
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-500 font-medium">
              ⚠️ Modifiche non salvate
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Usa le frecce direzionali o Tab per navigare rapidamente tra i campi.
        </p>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">
                Utente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                🥇 1° Posto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                🥈 2° Posto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                🥉 3° Posto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                Stato
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {users.map((userItem, rowIndex) => {
              const status = getRowStatus(userItem.prediction);
              const rowClass = status === 'complete' ? 'bg-green-500/10' : 
                              status === 'partial' ? 'bg-yellow-500/10' : 
                              status === 'invalid' ? 'bg-destructive/10' : '';

              return (
                <tr key={userItem.user.id} className={rowClass}>
                  {/* User Info */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {userItem.user.name || 'Nome non disponibile'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userItem.user.email}
                    </div>
                  </td>

                  {/* Prediction Fields */}
                  {[0, 1, 2].map((colIndex) => {
                    const fieldName = getFieldName(colIndex);
                    const value = getFieldValue(userItem.prediction, colIndex);
                    const key = `${userItem.user.id}-${colIndex}`;

                    return (
                      <td key={colIndex} className="px-4 py-3 whitespace-nowrap">
                        <select
                          ref={(el) => setSelectRef(key, el)}
                          value={value}
                          onChange={(e) => onPredictionChange(userItem.user.id, fieldName, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                          disabled={isLoading}
                          className="w-full p-2 border border-border bg-input text-foreground rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                        >
                          <option value="">Seleziona pilota...</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} ({driver.team})
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {status === 'complete' && <span className="text-green-500">✅</span>}
                    {status === 'partial' && <span className="text-yellow-500">⚠️</span>}
                    {status === 'invalid' && <span className="text-destructive">❌</span>}
                    {status === 'empty' && <span className="text-muted-foreground">⭕</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with stats */}
      <div className="bg-muted border-t border-border p-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            ✅ Completi: {users.filter(u => getRowStatus(u.prediction) === 'complete').length}
          </span>
          <span>
            ⚠️ Parziali: {users.filter(u => getRowStatus(u.prediction) === 'partial').length}
          </span>
          <span>
            ❌ Non validi: {users.filter(u => getRowStatus(u.prediction) === 'invalid').length}
          </span>
          <span>
            ⭕ Vuoti: {users.filter(u => getRowStatus(u.prediction) === 'empty').length}
          </span>
        </div>
      </div>
    </div>
  );
});
