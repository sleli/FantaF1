import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground appearance-none
              focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
              ${error ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-destructive ml-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
