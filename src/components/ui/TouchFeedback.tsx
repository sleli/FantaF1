'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface TouchFeedbackProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  rippleColor?: string;
  duration?: number;
}

export default function TouchFeedback({
  children,
  className = '',
  disabled = false,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  duration = 600
}: TouchFeedbackProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextRippleId = useRef(0);

  const createRipple = (event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newRipple = {
      id: nextRippleId.current++,
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseDown={createRipple}
      onTouchStart={createRipple}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            backgroundColor: rippleColor,
            animationDuration: `${duration}ms`,
            animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      ))}
    </div>
  );
}

// Hook for touch feedback on any element
export function useTouchFeedback(
  options: {
    rippleColor?: string;
    duration?: number;
    disabled?: boolean;
  } = {}
) {
  const { rippleColor = 'rgba(0, 0, 0, 0.1)', duration = 600, disabled = false } = options;
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLElement>(null);
  const nextRippleId = useRef(0);

  const createRipple = (event: MouseEvent | TouchEvent) => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newRipple = {
      id: nextRippleId.current++,
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => createRipple(e);
    const handleTouchStart = (e: TouchEvent) => createRipple(e);

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('touchstart', handleTouchStart);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [disabled, duration]);

  const rippleElements = ripples.map(ripple => (
    <span
      key={ripple.id}
      className="absolute pointer-events-none rounded-full animate-ping"
      style={{
        left: ripple.x - 10,
        top: ripple.y - 10,
        width: 20,
        height: 20,
        backgroundColor: rippleColor,
        animationDuration: `${duration}ms`,
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  ));

  return { containerRef, rippleElements };
}
