'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Driver, Event, ScoringType } from '@prisma/client';
import SortableDriverList from './SortableDriverList';
import DriverPickerSheet from './DriverPickerSheet';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DriverAvatar from '@/components/ui/DriverAvatar';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ExtendedEvent extends Event {
  season?: {
    scoringType: ScoringType;
    driverCount: number;
  };
}

interface PredictionFormProps {
  event: ExtendedEvent;
  drivers: Driver[];
  onSubmit: (prediction: any) => void;
  initialPrediction?: {
    firstPlaceId?: string;
    secondPlaceId?: string;
    thirdPlaceId?: string;
    rankings?: string[];
  };
  lastPrediction?: {
    rankings?: string[];
  };
  isLoading: boolean;
  isModifying?: boolean;
}

// Position card for LEGACY_TOP3 mode
function PositionCard({
  position,
  label,
  points,
  driver,
  onClick,
  disabled,
}: {
  position: 1 | 2 | 3;
  label: string;
  points: string;
  driver?: Driver | null;
  onClick: () => void;
  disabled?: boolean;
}) {
  const badgeVariant = position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-4 rounded-xl border transition-all duration-200
        text-left touch-active min-h-[80px]
        ${
          disabled
            ? 'bg-muted border-border opacity-60 cursor-not-allowed'
            : driver
            ? 'bg-surface-2 border-primary/30 hover:border-primary'
            : 'bg-surface-2 border-border hover:border-primary/50 hover:bg-surface-3'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Position badge */}
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            font-black text-lg
            ${
              position === 1
                ? 'bg-accent-gold/20 text-accent-gold'
                : position === 2
                ? 'bg-accent-silver/20 text-accent-silver'
                : 'bg-accent-bronze/20 text-accent-bronze'
            }
          `}
        >
          {position}°
        </div>

        {/* Driver avatar when selected */}
        {driver && (
          <DriverAvatar
            imageUrl={driver.imageUrl}
            name={driver.name}
            size="md"
          />
        )}

        {/* Driver info or placeholder */}
        <div className="flex-1 min-w-0">
          {driver ? (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-muted-foreground">
                  #{driver.number}
                </span>
                <span className="font-bold text-foreground truncate">
                  {driver.name}
                </span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {driver.team}
              </div>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                {label}
              </span>
              <div className="text-xs text-muted-foreground mt-0.5">
                {points}
              </div>
            </>
          )}
        </div>

        {/* Action indicator */}
        <div className="flex-shrink-0">
          {driver ? (
            <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
              <CheckIcon className="w-4 h-4 text-accent-green" />
            </div>
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>
    </button>
  );
}

export default function PredictionForm({
  event,
  drivers,
  onSubmit,
  initialPrediction,
  lastPrediction,
  isLoading,
  isModifying = false,
}: PredictionFormProps) {
  const scoringType = event.season?.scoringType || ScoringType.LEGACY_TOP3;
  const driverCount = event.season?.driverCount || 20;

  // View Mode State determined by Season Settings
  const viewMode = scoringType === ScoringType.FULL_GRID_DIFF ? 'GRID' : 'TOP3';

  // Legacy State
  const [firstPlaceId, setFirstPlaceId] = useState(
    initialPrediction?.firstPlaceId || ''
  );
  const [secondPlaceId, setSecondPlaceId] = useState(
    initialPrediction?.secondPlaceId || ''
  );
  const [thirdPlaceId, setThirdPlaceId] = useState(
    initialPrediction?.thirdPlaceId || ''
  );

  // New State
  const [orderedDriverIds, setOrderedDriverIds] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  // Driver picker sheet state
  const [pickerPosition, setPickerPosition] = useState<1 | 2 | 3 | null>(null);

  // Helper to get initial order based on history or random
  const getInitialOrder = useCallback(() => {
    const activeDrivers = drivers
      .filter((d) => d.active)
      .sort((a, b) => a.number - b.number);

    const activeDriverIds = activeDrivers.map((d) => d.id);

    if (
      initialPrediction?.rankings &&
      Array.isArray(initialPrediction.rankings) &&
      initialPrediction.rankings.length > 0
    ) {
      const savedRankings = initialPrediction.rankings as string[];
      const validSavedRankings = savedRankings.filter((id) =>
        activeDriverIds.includes(id)
      );
      const missingDriverIds = activeDriverIds.filter(
        (id) => !validSavedRankings.includes(id)
      );
      return [...validSavedRankings, ...missingDriverIds];
    }

    if (
      lastPrediction?.rankings &&
      Array.isArray(lastPrediction.rankings) &&
      lastPrediction.rankings.length > 0
    ) {
      const savedRankings = lastPrediction.rankings as string[];
      const validSavedRankings = savedRankings.filter((id) =>
        activeDriverIds.includes(id)
      );
      const missingDriverIds = activeDriverIds.filter(
        (id) => !validSavedRankings.includes(id)
      );
      return [...validSavedRankings, ...missingDriverIds];
    }

    // NEW PREDICTION (NO HISTORY): Randomize
    const shuffled = [...activeDriverIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [drivers, initialPrediction, lastPrediction]);

  // Initialize Ordered IDs
  useEffect(() => {
    if (orderedDriverIds.length === 0) {
      let initialOrder = getInitialOrder();

      if (
        scoringType === ScoringType.LEGACY_TOP3 &&
        (initialPrediction?.firstPlaceId ||
          initialPrediction?.secondPlaceId ||
          initialPrediction?.thirdPlaceId)
      ) {
        const top3 = [
          initialPrediction.firstPlaceId,
          initialPrediction.secondPlaceId,
          initialPrediction.thirdPlaceId,
        ].filter(Boolean) as string[];

        const top3Set = new Set(top3);
        const rest = initialOrder.filter((id) => !top3Set.has(id));
        initialOrder = [...top3, ...rest];
      }

      setOrderedDriverIds(initialOrder);
    }
  }, [getInitialOrder, scoringType, initialPrediction, orderedDriverIds.length]);

  // Event status
  const isEventOpen =
    event.status === 'UPCOMING' && new Date() < new Date(event.closingDate);

  // Get driver by ID
  const getDriver = useCallback(
    (id: string) => drivers.find((d) => d.id === id),
    [drivers]
  );

  // Get excluded driver IDs for picker
  const getExcludedDriverIds = useCallback(
    (position: 1 | 2 | 3) => {
      const ids = [firstPlaceId, secondPlaceId, thirdPlaceId];
      return ids.filter((id, index) => id && index !== position - 1);
    },
    [firstPlaceId, secondPlaceId, thirdPlaceId]
  );

  // Handle driver selection from picker
  const handleDriverSelect = useCallback(
    (driver: Driver) => {
      if (!pickerPosition) return;

      setTouched(true);
      switch (pickerPosition) {
        case 1:
          setFirstPlaceId(driver.id);
          break;
        case 2:
          setSecondPlaceId(driver.id);
          break;
        case 3:
          setThirdPlaceId(driver.id);
          break;
      }
    },
    [pickerPosition]
  );

  const activeDrivers = useMemo(
    () => drivers.filter((d) => d.active),
    [drivers]
  );
  const activeDriverIds = useMemo(
    () => activeDrivers.map((d) => d.id),
    [activeDrivers]
  );
  const requiredDriverCount = useMemo(() => {
    if (scoringType === ScoringType.FULL_GRID_DIFF) return activeDrivers.length;
    return 3;
  }, [scoringType, activeDrivers.length]);

  const validationErrors = useMemo(() => {
    const newErrors: string[] = [];

    if (scoringType === ScoringType.FULL_GRID_DIFF) {
      const unique = new Set(orderedDriverIds);
      if (unique.size !== orderedDriverIds.length) {
        newErrors.push('Sono presenti piloti duplicati nella griglia');
      }

      if (orderedDriverIds.length !== requiredDriverCount) {
        newErrors.push(`Devi ordinare tutti i ${requiredDriverCount} piloti`);
      }

      const unknownIds = orderedDriverIds.filter(
        (id) => !activeDriverIds.includes(id)
      );
      if (unknownIds.length > 0) {
        newErrors.push('La griglia contiene piloti non validi');
      }
    } else {
      if (!firstPlaceId) newErrors.push('Seleziona il pilota per il 1° posto');
      if (!secondPlaceId)
        newErrors.push('Seleziona il pilota per il 2° posto');
      if (!thirdPlaceId) newErrors.push('Seleziona il pilota per il 3° posto');

      const selectedDrivers = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(
        Boolean
      );
      const uniqueDrivers = new Set(selectedDrivers);
      if (selectedDrivers.length === 3 && uniqueDrivers.size !== 3) {
        newErrors.push('Devi selezionare 3 piloti diversi');
      }
    }

    if (!isEventOpen) {
      newErrors.push("L'evento non è più aperto per i pronostici");
    }

    return newErrors;
  }, [
    scoringType,
    orderedDriverIds,
    requiredDriverCount,
    activeDriverIds,
    firstPlaceId,
    secondPlaceId,
    thirdPlaceId,
    isEventOpen,
  ]);

  const isValid = validationErrors.length === 0;
  const displayedErrors = touched ? validationErrors : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let dataToSubmit: any = {};

    if (scoringType === ScoringType.FULL_GRID_DIFF) {
      let rankings = orderedDriverIds;
      if (viewMode === 'TOP3') {
        const top3 = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(Boolean);
        const top3Set = new Set(top3);
        const rest = orderedDriverIds.filter((id) => !top3Set.has(id));
        rankings = [...top3, ...rest];
      }
      dataToSubmit = { rankings };
    } else {
      if (viewMode === 'GRID') {
        dataToSubmit = {
          firstPlaceId: orderedDriverIds[0] || '',
          secondPlaceId: orderedDriverIds[1] || '',
          thirdPlaceId: orderedDriverIds[2] || '',
        };
      } else {
        dataToSubmit = {
          firstPlaceId,
          secondPlaceId,
          thirdPlaceId,
        };
      }
    }

    if (!isValid) {
      setTouched(true);
      return;
    }

    onSubmit(dataToSubmit);
  };

  const resetForm = () => {
    if (scoringType === ScoringType.FULL_GRID_DIFF) {
      setOrderedDriverIds(getInitialOrder());
    } else {
      setFirstPlaceId('');
      setSecondPlaceId('');
      setThirdPlaceId('');
    }
    setTouched(false);
  };

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<string>('');
  useEffect(() => {
    if (!isEventOpen) return;
    const updateTimer = () => {
      const now = new Date().getTime();
      const closingTime = new Date(event.closingDate).getTime();
      const difference = closingTime - now;
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        if (days > 0) setTimeLeft(`${days}g ${hours}h ${minutes}m`);
        else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        else setTimeLeft(`${minutes}m ${seconds}s`);
      } else setTimeLeft('Chiuso');
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [event.closingDate, isEventOpen]);

  // Is selection complete for TOP3 mode?
  const isTop3Complete = firstPlaceId && secondPlaceId && thirdPlaceId;

  return (
    <>
      {/* Header section - compact on mobile */}
      <div className="mb-4 px-1 md:px-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h2 className="text-lg md:text-2xl font-black text-foreground">
            {isModifying ? 'Modifica Pronostico' : 'Nuovo Pronostico'}
          </h2>
          <Badge variant={event.type === 'RACE' ? 'race' : 'sprint'}>
            {event.type === 'RACE' ? 'Gara' : 'Sprint'}
          </Badge>
        </div>

        <p className="font-semibold text-foreground text-sm md:text-base">{event.name}</p>
        <p className="text-xs md:text-sm text-muted-foreground">
          {new Date(event.date).toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* Countdown badge */}
        <div className="mt-2">
          {isEventOpen ? (
            <Badge variant="upcoming" size="lg">
              Chiusura: {timeLeft}
            </Badge>
          ) : (
            <Badge variant="closed" size="lg">
              Pronostici chiusi
            </Badge>
          )}
        </div>
      </div>

      {/* Closed event warning */}
      {!isEventOpen && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4 mx-1 md:mx-0">
          <p className="text-destructive font-medium text-sm">
            I pronostici per questo evento sono stati chiusi.
          </p>
        </div>
      )}

      {/* Grid section - full width on mobile, Card on desktop */}
      <div className="md:bg-card md:border md:border-border md:rounded-xl md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {viewMode === 'GRID' ? (
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 px-1 md:px-0">
                Ordina la griglia di arrivo prevista:
              </p>
              <SortableDriverList
                drivers={drivers}
                orderedDriverIds={orderedDriverIds}
                onChange={(newOrder) => {
                  setTouched(true);
                  setOrderedDriverIds(newOrder);
                }}
                disabled={!isEventOpen || isLoading}
              />
            </div>
          ) : (
            <div className="space-y-3 px-1 md:px-0">
              <p className="text-sm text-muted-foreground">
                Seleziona i piloti per il podio:
              </p>

              <PositionCard
                position={1}
                label="Seleziona 1° posto"
                points="25 punti"
                driver={firstPlaceId ? getDriver(firstPlaceId) : null}
                onClick={() => setPickerPosition(1)}
                disabled={!isEventOpen || isLoading}
              />

              <PositionCard
                position={2}
                label="Seleziona 2° posto"
                points="15 punti"
                driver={secondPlaceId ? getDriver(secondPlaceId) : null}
                onClick={() => setPickerPosition(2)}
                disabled={!isEventOpen || isLoading}
              />

              <PositionCard
                position={3}
                label="Seleziona 3° posto"
                points="10 punti"
                driver={thirdPlaceId ? getDriver(thirdPlaceId) : null}
                onClick={() => setPickerPosition(3)}
                disabled={!isEventOpen || isLoading}
              />
            </div>
          )}

          {/* Validation errors */}
          {displayedErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mx-1 md:mx-0">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-destructive"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-destructive mb-1">
                    Errori di validazione:
                  </h3>
                  <ul className="text-sm text-destructive list-disc list-inside space-y-0.5">
                    {displayedErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sprint note */}
          {event.type === 'SPRINT' && (
            <div className="bg-accent-cyan/10 border border-accent-cyan/30 rounded-xl p-4 mx-1 md:mx-0">
              <p className="text-accent-cyan text-sm">
                <strong>Sprint:</strong>{' '}
                {scoringType === ScoringType.FULL_GRID_DIFF
                  ? 'Le penalità saranno dimezzate (x 0.5)'
                  : 'I punteggi saranno dimezzati (12.5 - 7.5 - 5 punti)'}
              </p>
            </div>
          )}

          {/* Desktop buttons */}
          <div className="hidden md:flex gap-4">
            <Button
              type="submit"
              disabled={!isEventOpen || isLoading || !isValid}
              className="flex-1"
              isLoading={isLoading}
              size="lg"
            >
              {isModifying ? 'Aggiorna Pronostico' : 'Salva Pronostico'}
            </Button>

            {(firstPlaceId ||
              secondPlaceId ||
              thirdPlaceId ||
              orderedDriverIds.length > 0) && (
              <Button
                type="button"
                onClick={resetForm}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Mobile floating button */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 z-40 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isEventOpen || isLoading || !isValid}
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="shadow-elevation-4"
          >
            {isModifying ? 'Aggiorna Pronostico' : 'Salva Pronostico'}
          </Button>
        </div>
      </div>

      {/* Driver Picker Sheet for TOP3 mode */}
      {viewMode === 'TOP3' && (
        <DriverPickerSheet
          isOpen={pickerPosition !== null}
          onClose={() => setPickerPosition(null)}
          onSelect={handleDriverSelect}
          drivers={activeDrivers}
          selectedDriver={
            pickerPosition === 1
              ? getDriver(firstPlaceId) || null
              : pickerPosition === 2
              ? getDriver(secondPlaceId) || null
              : pickerPosition === 3
              ? getDriver(thirdPlaceId) || null
              : null
          }
          excludedDriverIds={pickerPosition ? getExcludedDriverIds(pickerPosition) : []}
          position={pickerPosition || undefined}
        />
      )}
    </>
  );
}
