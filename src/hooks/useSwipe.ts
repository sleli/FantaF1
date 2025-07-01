'use client';

import { useRef, useEffect, RefObject } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean; // Track mouse events for desktop testing
}

export function useSwipe<T extends HTMLElement>(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const {
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleStart = (clientX: number, clientY: number) => {
      startX = clientX;
      startY = clientY;
    };

    const handleMove = (clientX: number, clientY: number) => {
      endX = clientX;
      endY = clientY;
    };

    const handleEnd = () => {
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Check if swipe distance meets threshold
      if (Math.max(absDeltaX, absDeltaY) < threshold) return;

      // Determine swipe direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    };

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    // Mouse events (for desktop testing)
    let isMouseDown = false;

    const handleMouseDown = (e: MouseEvent) => {
      if (!trackMouse) return;
      isMouseDown = true;
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackMouse || !isMouseDown) return;
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!trackMouse || !isMouseDown) return;
      isMouseDown = false;
      handleEnd();
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    if (trackMouse) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (trackMouse) {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('mouseleave', handleMouseUp);
      }
    };
  }, [handlers, threshold, preventDefaultTouchmoveEvent, trackMouse]);

  return ref;
}

// Hook for pull-to-refresh
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  options: { threshold?: number; enabled?: boolean } = {}
) {
  const { threshold = 100, enabled = true } = options;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const element = ref.current;
    if (!element) return;

    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop > 0) return;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (element.scrollTop > 0 || isRefreshing) return;
      
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        e.preventDefault();
        const pullDistance = Math.min(deltaY, threshold * 1.5);
        element.style.transform = `translateY(${pullDistance * 0.5}px)`;
        
        if (pullDistance >= threshold) {
          element.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
        } else {
          element.style.backgroundColor = 'transparent';
        }
      }
    };

    const handleTouchEnd = async () => {
      if (element.scrollTop > 0 || isRefreshing) return;

      const deltaY = currentY - startY;
      
      if (deltaY >= threshold) {
        isRefreshing = true;
        element.style.transform = `translateY(${threshold * 0.3}px)`;
        
        try {
          await onRefresh();
        } finally {
          isRefreshing = false;
          element.style.transform = 'translateY(0)';
          element.style.backgroundColor = 'transparent';
        }
      } else {
        element.style.transform = 'translateY(0)';
        element.style.backgroundColor = 'transparent';
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, enabled]);

  return ref;
}
