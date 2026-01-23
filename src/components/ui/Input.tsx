import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${error ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-destructive ml-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
