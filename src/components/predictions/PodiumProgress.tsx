'use client';

import { CheckIcon } from '@heroicons/react/24/solid';

interface PodiumProgressProps {
  firstPlaceId?: string;
  secondPlaceId?: string;
  thirdPlaceId?: string;
  className?: string;
}

export default function PodiumProgress({
  firstPlaceId,
  secondPlaceId,
  thirdPlaceId,
  className = '',
}: PodiumProgressProps) {
  const positions = [
    { position: 1, filled: !!firstPlaceId, label: '1°' },
    { position: 2, filled: !!secondPlaceId, label: '2°' },
    { position: 3, filled: !!thirdPlaceId, label: '3°' },
  ];

  // Determine current step (first unfilled)
  const currentStep = positions.findIndex((p) => !p.filled);
  const allComplete = currentStep === -1;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {positions.map((pos, index) => {
        const isComplete = pos.filled;
        const isCurrent = index === currentStep;
        const isPending = !isComplete && !isCurrent;

        return (
          <div key={pos.position} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-bold text-sm transition-all duration-300
                  ${
                    isComplete
                      ? 'bg-accent-green text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                      : isCurrent
                      ? 'border-2 border-primary text-primary bg-primary/10 animate-pulse'
                      : 'border-2 border-border text-muted-foreground bg-surface-2'
                  }
                `}
              >
                {isComplete ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  pos.label
                )}
              </div>

              {/* Position label */}
              <span
                className={`
                  text-[10px] font-semibold mt-1
                  ${
                    isComplete
                      ? 'text-accent-green'
                      : isCurrent
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }
                `}
              >
                {pos.position === 1
                  ? 'Oro'
                  : pos.position === 2
                  ? 'Argento'
                  : 'Bronzo'}
              </span>
            </div>

            {/* Connector line */}
            {index < positions.length - 1 && (
              <div
                className={`
                  w-8 h-0.5 mx-1 mb-4 rounded-full transition-all duration-300
                  ${
                    positions[index + 1].filled || (isComplete && isCurrent)
                      ? 'bg-accent-green'
                      : isComplete
                      ? 'bg-primary'
                      : 'bg-border'
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact version for inline use
export function PodiumProgressCompact({
  firstPlaceId,
  secondPlaceId,
  thirdPlaceId,
  className = '',
}: PodiumProgressProps) {
  const filledCount = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(
    Boolean
  ).length;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[1, 2, 3].map((pos) => {
        const isFilled = pos <= filledCount;

        return (
          <div
            key={pos}
            className={`
              w-2.5 h-2.5 rounded-full transition-all duration-200
              ${
                isFilled
                  ? 'bg-accent-green shadow-[0_0_6px_rgba(34,197,94,0.5)]'
                  : 'bg-border'
              }
            `}
          />
        );
      })}
      <span className="text-xs text-muted-foreground ml-1">
        {filledCount}/3
      </span>
    </div>
  );
}

// Badge variant showing completion status
export function PodiumProgressBadge({
  firstPlaceId,
  secondPlaceId,
  thirdPlaceId,
  className = '',
}: PodiumProgressProps) {
  const filledCount = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(
    Boolean
  ).length;
  const isComplete = filledCount === 3;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        ${
          isComplete
            ? 'bg-accent-green/20 text-accent-green'
            : 'bg-surface-3 text-muted-foreground'
        }
        ${className}
      `}
    >
      {isComplete ? (
        <>
          <CheckIcon className="w-3.5 h-3.5" />
          <span>Completo</span>
        </>
      ) : (
        <>
          <span>{filledCount}/3 selezionati</span>
        </>
      )}
    </div>
  );
}
