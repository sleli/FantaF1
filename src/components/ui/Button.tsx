import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98] touch-active
  `;

  const variants = {
    primary: `
      bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary
      shadow-[0_4px_14px_0_rgba(225,6,0,0.39)] hover:shadow-[0_6px_20px_rgba(225,6,0,0.5)]
      border border-transparent
    `,
    secondary: `
      bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary
      border border-border hover:border-border/80
    `,
    outline: `
      bg-transparent border-2 border-border text-muted-foreground
      hover:border-primary hover:text-primary focus:ring-primary
    `,
    ghost: `
      bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent focus:ring-accent
    `,
    danger: `
      bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive
      shadow-[0_4px_14px_0_rgba(153,27,27,0.3)]
    `,
    success: `
      bg-accent-green text-white hover:bg-accent-green/90 focus:ring-accent-green
      shadow-[0_4px_14px_0_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)]
      border border-transparent
    `,
  };

  const sizes = {
    sm: 'text-xs px-3 py-2 gap-1.5 min-h-[36px]',
    md: 'text-sm px-5 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[52px]',
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}
