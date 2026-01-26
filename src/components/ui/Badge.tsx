import { ReactNode } from 'react';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  // Event status variants
  | 'upcoming'
  | 'closing'
  | 'closed'
  | 'completed'
  // Event type variants
  | 'race'
  | 'sprint'
  // Podium variants
  | 'gold'
  | 'silver'
  | 'bronze';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
}: BadgeProps) {
  const baseStyles = `
    inline-flex items-center font-bold uppercase tracking-wider border rounded-full
    transition-all duration-200
  `;

  const variants: Record<BadgeVariant, string> = {
    // Standard variants
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    neutral: 'bg-muted text-muted-foreground border-border',

    // Event status variants
    upcoming: 'bg-accent-green/20 text-accent-green border-accent-green/30',
    closing: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30 animate-pulse',
    closed: 'bg-red-500/20 text-red-400 border-red-500/30',
    completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',

    // Event type variants
    race: 'bg-primary/20 text-primary border-primary/30',
    sprint: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',

    // Podium variants
    gold: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30 shadow-glow-gold',
    silver: 'bg-accent-silver/20 text-accent-silver border-accent-silver/30',
    bronze: 'bg-accent-bronze/20 text-accent-bronze border-accent-bronze/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  // Override pulse animation if variant is 'closing' (already has pulse) or pulse prop is true
  const pulseClass = pulse && variant !== 'closing' ? 'animate-pulse' : '';

  return (
    <span
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${pulseClass}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Helper function to get badge variant from event status
export function getEventStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'UPCOMING':
      return 'upcoming';
    case 'CLOSING':
      return 'closing';
    case 'CLOSED':
      return 'closed';
    case 'COMPLETED':
      return 'completed';
    default:
      return 'neutral';
  }
}

// Helper function to get badge variant from event type
export function getEventTypeVariant(type: string): BadgeVariant {
  switch (type) {
    case 'RACE':
      return 'race';
    case 'SPRINT':
      return 'sprint';
    default:
      return 'neutral';
  }
}

// Helper function to get podium variant
export function getPodiumVariant(position: number): BadgeVariant {
  switch (position) {
    case 1:
      return 'gold';
    case 2:
      return 'silver';
    case 3:
      return 'bronze';
    default:
      return 'neutral';
  }
}
