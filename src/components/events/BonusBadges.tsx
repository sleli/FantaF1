'use client';

interface BonusBadgesProps {
  baseScore: number | null | undefined;
  podiumBonus?: number | null;
  sprintMultiplier?: number | null;
  catchupMultiplier?: number | null;
  compact?: boolean;
  className?: string;
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export default function BonusBadges({
  baseScore,
  podiumBonus,
  sprintMultiplier,
  catchupMultiplier,
  compact = false,
  className = '',
}: BonusBadgesProps) {
  const hasBase = typeof baseScore === 'number' && Number.isFinite(baseScore);
  const hasPodium = typeof podiumBonus === 'number' && podiumBonus !== 0;
  const hasSprint = typeof sprintMultiplier === 'number' && sprintMultiplier !== 1;
  const hasCatchup = typeof catchupMultiplier === 'number' && catchupMultiplier < 1;

  if (!hasBase && !hasPodium && !hasSprint && !hasCatchup) {
    return null;
  }

  const sizeCls = compact
    ? 'text-[10px] px-1.5 py-0.5 leading-none'
    : 'text-xs px-2 py-1';
  const chip = `inline-flex items-center gap-1 rounded font-medium tabular-nums ${sizeCls}`;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {hasBase && (
        <span className={`${chip} bg-muted/40 text-muted-foreground`}>
          <span className="opacity-70">Base</span>
          <span>+{formatScore(baseScore!)}</span>
        </span>
      )}
      {hasPodium && (
        <span className={`${chip} bg-accent-green/10 text-accent-green`}>
          <span className="opacity-80">Podio</span>
          <span>{formatScore(podiumBonus!)}</span>
        </span>
      )}
      {hasSprint && (
        <span className={`${chip} bg-foreground/10 text-foreground`}>
          <span className="opacity-70">Sprint</span>
          <span>x{sprintMultiplier}</span>
        </span>
      )}
      {hasCatchup && (
        <span className={`${chip} bg-amber-500/15 text-amber-400`}>
          <span className="opacity-80">Catch-up</span>
          <span>x{catchupMultiplier!.toFixed(1)}</span>
        </span>
      )}
    </div>
  );
}
