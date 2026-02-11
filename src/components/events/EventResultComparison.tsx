'use client';

import { Driver, ScoringType } from '@prisma/client';
import DriverAvatar from '@/components/ui/DriverAvatar';
import PositionBadge from '@/components/ui/PositionBadge';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface CompletedEvent {
  id: string;
  name: string;
  type: 'RACE' | 'SPRINT';
  date: string;
  status: string;
  firstPlace?: { id: string; name: string; team: string; number: number } | null;
  secondPlace?: { id: string; name: string; team: string; number: number } | null;
  thirdPlace?: { id: string; name: string; team: string; number: number } | null;
  results?: string[] | null;
  season?: { scoringType: string } | null;
}

interface Prediction {
  id: string;
  eventId: string;
  points: number | null;
  firstPlaceId?: string | null;
  secondPlaceId?: string | null;
  thirdPlaceId?: string | null;
  rankings?: string[] | null;
}

interface EventResultComparisonProps {
  event: CompletedEvent;
  prediction: Prediction | null;
  drivers: Driver[];
  scoringType: string;
}

export default function EventResultComparison({
  event,
  prediction,
  drivers,
  scoringType,
}: EventResultComparisonProps) {
  const getDriver = (id: string) => drivers.find((d) => d.id === id);

  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    return (
      <FullGridComparison
        event={event}
        prediction={prediction}
        getDriver={getDriver}
      />
    );
  }

  return (
    <LegacyTop3Comparison
      event={event}
      prediction={prediction}
      getDriver={getDriver}
    />
  );
}

// --- FULL_GRID_DIFF comparison ---

function FullGridComparison({
  event,
  prediction,
  getDriver,
}: {
  event: CompletedEvent;
  prediction: Prediction | null;
  getDriver: (id: string) => Driver | undefined;
}) {
  const resultGrid = (event.results as string[]) || [];
  const predictionGrid = (prediction?.rankings as string[]) || [];
  const hasPrediction = predictionGrid.length > 0;

  // Build a map of driverId → predicted position (0-indexed)
  const predictionMap = new Map<string, number>();
  predictionGrid.forEach((driverId, idx) => {
    predictionMap.set(driverId, idx);
  });

  return (
    <div className="mt-4">
      {!hasPrediction && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 rounded-t-lg">
          <span className="text-xs text-amber-400 font-medium">
            Nessun pronostico inserito
          </span>
        </div>
      )}

      {/* Grid rows */}
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted rounded-lg border border-border/50">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-12">Pos</th>
              <th className="px-3 py-2 text-left font-medium">Pilota</th>
              <th className="px-3 py-2 text-center font-medium w-16">Pron.</th>
              <th className="px-3 py-2 text-right font-medium w-16">Punti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {resultGrid.map((driverId, idx) => {
              const driver = getDriver(driverId);
              const predictedPos = predictionMap.get(driverId);
              const isMatch = predictedPos === idx;
              const diff = predictedPos !== undefined ? Math.abs(predictedPos - idx) : null;
              const isMissing = predictedPos === undefined;

              return (
                <tr key={`${driverId}-${idx}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">
                     <PositionBadge position={idx + 1} size="sm" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {driver && <DriverAvatar imageUrl={driver.imageUrl} name={driver.name} size="xs" />}
                      <div className="min-w-0">
                        <div className="font-medium truncate text-foreground">{driver?.name || 'Sconosciuto'}</div>
                        <div className="text-xs text-muted-foreground truncate hidden sm:block">{driver?.team}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {hasPrediction ? (
                      predictedPos !== undefined ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                          isMatch 
                            ? 'bg-accent-green/10 text-accent-green' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {predictedPos + 1}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {hasPrediction ? (
                      isMissing ? (
                        <span className="text-red-500 text-xs">+20</span>
                      ) : (
                        <span className={`text-xs ${diff === 0 ? 'text-accent-green' : diff && diff <= 2 ? 'text-accent-amber' : 'text-foreground'}`}>
                          +{diff}
                        </span>
                      )
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- LEGACY_TOP3 comparison ---

function LegacyTop3Comparison({
  event,
  prediction,
  getDriver,
}: {
  event: CompletedEvent;
  prediction: Prediction | null;
  getDriver: (id: string) => Driver | undefined;
}) {
  const positionConfig = {
    1: {
      label: '1° Posto',
      emoji: '🥇',
      color: 'text-accent-gold',
      bgColor: 'bg-accent-gold/10',
      borderColor: 'border-accent-gold/20',
      racePoints: 25,
      sprintPoints: 12.5,
      resultDriverId: event.firstPlace?.id,
      predDriverId: prediction?.firstPlaceId,
    },
    2: {
      label: '2° Posto',
      emoji: '🥈',
      color: 'text-accent-silver',
      bgColor: 'bg-accent-silver/10',
      borderColor: 'border-accent-silver/20',
      racePoints: 15,
      sprintPoints: 7.5,
      resultDriverId: event.secondPlace?.id,
      predDriverId: prediction?.secondPlaceId,
    },
    3: {
      label: '3° Posto',
      emoji: '🥉',
      color: 'text-accent-bronze',
      bgColor: 'bg-accent-bronze/10',
      borderColor: 'border-accent-bronze/20',
      racePoints: 10,
      sprintPoints: 5,
      resultDriverId: event.thirdPlace?.id,
      predDriverId: prediction?.thirdPlaceId,
    },
  } as const;

  const hasPrediction = prediction !== null;

  return (
    <div className="space-y-3">
      {!hasPrediction && (
        <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-xs text-amber-400 font-medium">
            Nessun pronostico inserito
          </span>
        </div>
      )}

      {([1, 2, 3] as const).map((pos) => {
        const config = positionConfig[pos];
        const maxPoints = event.type === 'SPRINT' ? config.sprintPoints : config.racePoints;
        const resultDriver = config.resultDriverId ? getDriver(config.resultDriverId) : null;
        const predDriver = config.predDriverId ? getDriver(config.predDriverId) : null;
        const isExact = hasPrediction && config.resultDriverId === config.predDriverId;

        // Check if predicted driver appears anywhere in results (bonus)
        const resultIds = [event.firstPlace?.id, event.secondPlace?.id, event.thirdPlace?.id];
        const isInPodium = hasPrediction && config.predDriverId
          ? resultIds.includes(config.predDriverId) && !isExact
          : false;

        return (
          <div
            key={pos}
            className={`rounded-xl p-4 border transition-all ${config.bgColor} ${config.borderColor}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.emoji}</span>
                <span className={`text-sm font-semibold ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <span className={`text-xs font-medium ${config.color}`}>
                {maxPoints} pt
              </span>
            </div>

            {/* Result driver */}
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Risultato
              </span>
              {resultDriver ? (
                <div className="flex items-center gap-3 mt-1">
                  <DriverAvatar
                    imageUrl={resultDriver.imageUrl}
                    name={resultDriver.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground truncate">
                      {resultDriver.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      #{resultDriver.number} · {resultDriver.team}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic mt-1">
                  Non disponibile
                </div>
              )}
            </div>

            {/* Prediction comparison */}
            {hasPrediction && (
              <div className="pt-2 border-t border-border/30">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Pronostico
                </span>
                {isExact ? (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircleIcon className="w-5 h-5 text-accent-green flex-shrink-0" />
                    <span className="text-sm font-bold text-accent-green">
                      Esatto!
                    </span>
                  </div>
                ) : predDriver ? (
                  <div className="flex items-center gap-3 mt-1 opacity-60">
                    <DriverAvatar
                      imageUrl={predDriver.imageUrl}
                      name={predDriver.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm truncate">
                        {predDriver.name}
                      </div>
                      {isInPodium && (
                        <span className="text-[10px] text-accent-amber font-medium">
                          Sul podio, posizione sbagliata
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic mt-1">
                    Nessuna selezione
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Total score */}
      {prediction?.points !== null && prediction?.points !== undefined && (
        <div className="flex items-center justify-between px-4 py-3 bg-surface-2 rounded-xl border border-border">
          <span className="text-sm font-semibold text-muted-foreground">
            Punteggio totale
          </span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {prediction.points} pt
          </span>
        </div>
      )}
    </div>
  );
}
