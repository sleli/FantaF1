import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive';
}

export default function Card({ 
  className = '', 
  variant = 'default',
  children, 
  ...props 
}: CardProps) {
  const baseStyles = "rounded-xl border transition-all duration-300";
  
  const variants = {
    default: "bg-card text-card-foreground border-border shadow-[0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(0,0,0,0.42)]",
    glass: "glass-panel text-card-foreground",
    interactive: "bg-card text-card-foreground border-border hover:border-primary/50 hover:shadow-glow hover:-translate-y-1 cursor-pointer",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
