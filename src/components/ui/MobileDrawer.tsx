'use client';

import { Fragment, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  showHandle?: boolean;
  closeOnSwipeDown?: boolean;
  snapPoints?: ('content' | 'full' | number)[];
  initialSnap?: number;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  showHandle = true,
  closeOnSwipeDown = true,
  snapPoints = ['content'],
  initialSnap = 0,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
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

  // Reset translate when opening
  useEffect(() => {
    if (isOpen) {
      setTranslateY(0);
    }
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    // Only allow dragging down (positive diff)
    if (diff > 0) {
      currentYRef.current = diff;
      setTranslateY(diff);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    // If dragged more than 100px down, close the drawer
    if (closeOnSwipeDown && currentYRef.current > 100) {
      onClose();
    } else {
      // Snap back
      setTranslateY(0);
    }
  }, [closeOnSwipeDown, onClose]);

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-card border-t border-border rounded-t-3xl
          shadow-elevation-4 max-h-[90vh] overflow-hidden
          ${isDragging ? '' : 'transition-transform duration-300'}
          ${isOpen ? 'animate-slide-in-up' : ''}
        `}
        style={{
          transform: `translateY(${translateY}px)`,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
      >
        {/* Drag Handle */}
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || description) && (
          <div className="px-6 py-4 border-b border-border">
            {title && (
              <h2
                id="drawer-title"
                className="text-lg font-bold text-foreground"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain max-h-[calc(90vh-100px)] pb-safe-bottom">
          {children}
        </div>
      </div>
    </Fragment>
  );
}

// Drawer content wrapper with padding
export function DrawerContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

// Drawer footer for actions
export function DrawerFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        sticky bottom-0 p-4 bg-card border-t border-border
        safe-area-bottom ${className}
      `}
    >
      {children}
    </div>
  );
}

// Drawer list for selection items
interface DrawerListItemProps {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
}

export function DrawerListItem({
  children,
  onClick,
  selected = false,
  leftIcon,
  rightIcon,
  disabled = false,
}: DrawerListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-6 py-4 min-h-[56px]
        text-left transition-colors touch-active
        ${selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-3'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'}
        border-b border-border last:border-b-0
      `}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span className="flex-1">{children}</span>
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      {selected && !rightIcon && (
        <svg
          className="w-5 h-5 text-primary flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}

// Hook for managing drawer state
import { useMemo } from 'react';

export function useMobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
    }),
    []
  );

  return {
    isOpen,
    ...actions,
  };
}
