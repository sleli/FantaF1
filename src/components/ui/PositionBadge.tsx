interface PositionBadgeProps {
  position: number;
  size?: 'default' | 'sm';
}

export default function PositionBadge({ position, size = 'default' }: PositionBadgeProps) {
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
