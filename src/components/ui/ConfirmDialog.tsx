'use client';

import { Fragment, ReactNode, useCallback, useEffect } from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: (
        <svg
          className="w-6 h-6 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      iconBg: 'bg-destructive/10',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: (
        <svg
          className="w-6 h-6 text-accent-amber"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: 'bg-accent-amber/10',
      buttonVariant: 'primary' as const,
    },
    info: {
      icon: (
        <svg
          className="w-6 h-6 text-accent-cyan"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: 'bg-accent-cyan/10',
      buttonVariant: 'primary' as const,
    },
  };

  const { icon, iconBg, buttonVariant } = variantStyles[variant];

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="
            w-full max-w-md bg-card border border-border rounded-2xl shadow-elevation-4
            animate-scale-in overflow-hidden
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <div className="p-6">
            {/* Icon */}
            <div
              className={`w-12 h-12 mx-auto mb-4 rounded-full ${iconBg} flex items-center justify-center`}
            >
              {icon}
            </div>

            {/* Content */}
            <h2
              id="dialog-title"
              className="text-lg font-bold text-center text-foreground mb-2"
            >
              {title}
            </h2>

            {description && (
              <div className="text-sm text-muted-foreground text-center">
                {description}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 bg-surface-2 border-t border-border">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={buttonVariant}
              className="flex-1"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

// Hook for managing confirm dialog state
import { useState } from 'react';

interface UseConfirmDialogOptions {
  title: string;
  description?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<UseConfirmDialogOptions>({
    title: '',
  });

  const confirm = useCallback((opts: UseConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resolveRef?.(false);
  }, [resolveRef]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef?.(true);
  }, [resolveRef]);

  const ConfirmDialogComponent = useCallback(
    () => (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        {...options}
      />
    ),
    [isOpen, handleClose, handleConfirm, isLoading, options]
  );

  return {
    confirm,
    setIsLoading,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
