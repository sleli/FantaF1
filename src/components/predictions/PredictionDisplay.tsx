'use client';

import { PredictionWithDetails } from '@/lib/types';
import { Driver, ScoringType } from '@prisma/client';
import DriverAvatar from '@/components/ui/DriverAvatar';

interface PredictionDisplayProps {
  prediction: PredictionWithDetails;
  drivers: Driver[];
  compact?: boolean;
}

// Position badge component for podium distinction
function PositionBadge({
  position,
  size = 'default',
}: {
  position: number;
  size?: 'default' | 'sm';
}) {
  const isPodium = position <= 3;
  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  const badgeClasses = isPodium
    ? position === 1
      ? 'bg-accent-gold/20 text-accent-gold'
      : position === 2
      ? 'bg-accent-silver/20 text-accent-silver'
      : 'bg-accent-bronze/20 text-accent-bronze'
    : 'bg-surface-3 text-muted-foreground';

  return (
    <div
      className={`
        ${sizeClasses} rounded-full flex items-center justify-center
        font-black tabular-nums flex-shrink-0
        ${badgeClasses}
      `}
    >
      {position}
    </div>
  );
}

// Open design driver row for full grid display
function DriverRow({
  driver,
  position,
  isLast,
  isPodiumEnd,
}: {
  driver?: Driver | null;
  position: number;
  isLast?: boolean;
  isPodiumEnd?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 py-3 px-1">
        <PositionBadge position={position} size="sm" />

        {driver ? (
          <>
            <DriverAvatar imageUrl={driver.imageUrl} name={driver.name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm truncate">
                {driver.name}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-bold">#{driver.number}</span>
                <span className="opacity-50">·</span>
                <span className="truncate">{driver.team}</span>
              </div>
            </div>
          </>
        ) : (
          <span className="text-sm text-muted-foreground italic">Pilota non trovato</span>
        )}
      </div>

      {/* Divider */}
      {!isLast && (
        isPodiumEnd ? (
          <div className="h-px bg-primary/30 mx-1" />
        ) : (
          <div className="border-b border-dashed border-border/40 mx-1" />
        )
      )}
    </>
  );
}

// Open design podium position card
function PodiumPositionCard({
  position,
  driver,
  eventType,
}: {
  position: 1 | 2 | 3;
  driver?: { name: string; number: number; team: string; imageUrl?: string | null } | null;
  eventType: string;
}) {
  const positionConfig = {
    1: {
      label: '1° Posto',
      emoji: '🥇',
      color: 'text-accent-gold',
      bgColor: 'bg-accent-gold/10',
      borderColor: 'border-accent-gold/20',
      points: eventType === 'SPRINT' ? '12.5' : '25',
    },
    2: {
      label: '2° Posto',
      emoji: '🥈',
      color: 'text-accent-silver',
      bgColor: 'bg-accent-silver/10',
      borderColor: 'border-accent-silver/20',
      points: eventType === 'SPRINT' ? '7.5' : '15',
    },
    3: {
      label: '3° Posto',
      emoji: '🥉',
      color: 'text-accent-bronze',
      bgColor: 'bg-accent-bronze/10',
      borderColor: 'border-accent-bronze/20',
      points: eventType === 'SPRINT' ? '5' : '10',
    },
  };

  const config = positionConfig[position];

  return (
    <div
      className={`
        rounded-xl p-4 border transition-all
        ${config.bgColor} ${config.borderColor}
      `}
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
          {config.points} pt
        </span>
      </div>

      {/* Driver info */}
      {driver ? (
        <div className="flex items-center gap-3">
          <DriverAvatar
            imageUrl={driver.imageUrl}
            name={driver.name}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-foreground truncate">
              {driver.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-bold">#{driver.number}</span>
              <span className="opacity-50">·</span>
              <span className="truncate">{driver.team}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic py-2">
          Nessun pilota selezionato
        </div>
      )}
    </div>
  );
}

export default function PredictionDisplay({
  prediction,
  drivers,
  compact = false,
}: PredictionDisplayProps) {
  const scoringType =
    (prediction.event as any).season?.scoringType || ScoringType.LEGACY_TOP3;

  // Helper to find driver
  const getDriver = (id: string) => drivers?.find((d) => d.id === id);

  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    const rankings = (prediction.rankings as string[]) || [];

    if (compact) {
      // Compact view - only show top 5
      return (
        <div className="space-y-0">
          {rankings.slice(0, 5).map((id, idx) => {
            const driver = getDriver(id);
            return (
              <DriverRow
                key={`${prediction.id}-${idx}`}
                driver={driver}
                position={idx + 1}
                isLast={idx === 4}
                isPodiumEnd={idx === 2}
              />
            );
          })}
          {rankings.length > 5 && (
            <div className="text-xs text-muted-foreground text-center py-2 mt-2 border-t border-dashed border-border/40">
              +{rankings.length - 5} altri piloti
            </div>
          )}
        </div>
      );
    }

    // Full grid view - Open design
    return (
      <div className="rounded-xl border border-border bg-surface-1/50 overflow-hidden">
        <div className="px-3 py-2 bg-surface-2 border-b border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Ordine di arrivo pronosticato
          </h4>
        </div>
        <div className="px-2 py-1 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
          {rankings.length > 0 ? (
            rankings.map((id, idx) => {
              const driver = getDriver(id);
              return (
                <DriverRow
                  key={`${prediction.id}-${idx}`}
                  driver={driver}
                  position={idx + 1}
                  isLast={idx === rankings.length - 1}
                  isPodiumEnd={idx === 2}
                />
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground italic py-4 text-center">
              Nessun pilota ordinato
            </p>
          )}
        </div>
      </div>
    );
  }

  // LEGACY_TOP3 - Open design podium cards
  return (
    <div className="space-y-3">
      <PodiumPositionCard
        position={1}
        driver={prediction.firstPlace}
        eventType={prediction.event.type}
      />
      <PodiumPositionCard
        position={2}
        driver={prediction.secondPlace}
        eventType={prediction.event.type}
      />
      <PodiumPositionCard
        position={3}
        driver={prediction.thirdPlace}
        eventType={prediction.event.type}
      />
    </div>
  );
}

// Compact horizontal version for cards/lists
export function PredictionDisplayCompact({
  prediction,
  drivers,
}: PredictionDisplayProps) {
  const scoringType =
    (prediction.event as any).season?.scoringType || ScoringType.LEGACY_TOP3;

  const getDriver = (id: string) => drivers?.find((d) => d.id === id);

  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    const rankings = (prediction.rankings as string[]) || [];
    const top3 = rankings.slice(0, 3);

    return (
      <div className="flex items-center gap-2">
        {top3.map((id, idx) => {
          const driver = getDriver(id);
          return (
            <div key={`${prediction.id}-compact-${idx}`} className="flex items-center gap-1.5">
              <PositionBadge position={idx + 1} size="sm" />
              {driver && (
                <DriverAvatar imageUrl={driver.imageUrl} name={driver.name} size="sm" />
              )}
              {idx < 2 && <span className="text-border mx-1">→</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // LEGACY_TOP3 compact
  return (
    <div className="flex items-center gap-2">
      {[prediction.firstPlace, prediction.secondPlace, prediction.thirdPlace].map(
        (driver, idx) => (
          <div key={`${prediction.id}-compact-${idx}`} className="flex items-center gap-1.5">
            <PositionBadge position={idx + 1} size="sm" />
            {driver && (
              <DriverAvatar imageUrl={driver.imageUrl} name={driver.name} size="sm" />
            )}
            {idx < 2 && <span className="text-border mx-1">→</span>}
          </div>
        )
      )}
    </div>
  );
}
