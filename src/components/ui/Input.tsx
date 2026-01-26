import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-label uppercase text-muted-foreground mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 min-h-[44px] bg-input border border-border rounded-lg
              text-foreground placeholder-muted-foreground
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted
              transition-all duration-200
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-destructive ml-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-muted-foreground ml-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
