import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'highlight' | 'elevated';
  isLoading?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({
  className = '',
  variant = 'default',
  isLoading = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-xl border transition-all duration-300';

  const variants = {
    default: `
      bg-card text-card-foreground border-border
      shadow-[0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(0,0,0,0.42)]
    `,
    glass: 'glass-panel text-card-foreground',
    interactive: `
      bg-card text-card-foreground border-border
      hover:border-primary/50 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer
      active:scale-[0.99] touch-active
    `,
    highlight: `
      bg-card text-card-foreground border-border
      shadow-[0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(0,0,0,0.42)]
      racing-line-left pl-4
    `,
    elevated: `
      bg-surface-2 text-card-foreground border-border
      shadow-elevation-3
    `,
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  if (isLoading) {
    return (
      <div
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        <div className="space-y-4">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-20 w-full rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div
      className={`flex flex-col space-y-1.5 pb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <h3
      className={`text-lg font-bold leading-none tracking-tight text-foreground ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <p
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div
      className={`flex items-center pt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
