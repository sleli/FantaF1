'use client';

import { useEffect, useCallback, useRef } from 'react';

// Hook for debouncing functions
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunc = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunc;
}

// Hook for throttling functions
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);

  const throttledFunc = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        func(...args);
      }
    },
    [func, delay]
  ) as T;

  return throttledFunc;
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        callback(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return elementRef;
}

// Hook for measuring performance
export function usePerformanceMonitor() {
  const measureRef = useRef<{ [key: string]: number }>({});

  const startMeasure = useCallback((name: string) => {
    measureRef.current[name] = performance.now();
  }, []);

  const endMeasure = useCallback((name: string) => {
    const startTime = measureRef.current[name];
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      delete measureRef.current[name];
      return duration;
    }
    return 0;
  }, []);

  const measureAsync = useCallback(async <T>(
    name: string,
    asyncFunc: () => Promise<T>
  ): Promise<T> => {
    startMeasure(name);
    try {
      const result = await asyncFunc();
      endMeasure(name);
      return result;
    } catch (error) {
      endMeasure(name);
      throw error;
    }
  }, [startMeasure, endMeasure]);

  return { startMeasure, endMeasure, measureAsync };
}

// Hook for preloading resources
export function usePreload() {
  const preloadedResources = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (sources: string[]) => {
    const promises = sources.map(src => preloadImage(src));
    await Promise.allSettled(promises);
  }, [preloadImage]);

  return { preloadImage, preloadImages };
}

// Hook for optimizing scroll performance
export function useOptimizedScroll(
  callback: (scrollY: number) => void,
  throttleMs: number = 16
) {
  const throttledCallback = useThrottle(callback, throttleMs);

  useEffect(() => {
    const handleScroll = () => {
      throttledCallback(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [throttledCallback]);
}

// Hook for detecting slow network
export function useNetworkStatus() {
  const getConnectionInfo = useCallback(() => {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    if (!connection) {
      return { effectiveType: 'unknown', downlink: 0, rtt: 0 };
    }

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0
    };
  }, []);

  const isSlowConnection = useCallback(() => {
    const { effectiveType, downlink } = getConnectionInfo();
    return effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1;
  }, [getConnectionInfo]);

  return { getConnectionInfo, isSlowConnection };
}

// Hook for memory usage monitoring
export function useMemoryMonitor() {
  const getMemoryInfo = useCallback(() => {
    const memory = (performance as any).memory;
    
    if (!memory) {
      return null;
    }

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }, []);

  const isMemoryPressure = useCallback(() => {
    const memoryInfo = getMemoryInfo();
    return memoryInfo ? memoryInfo.usagePercentage > 80 : false;
  }, [getMemoryInfo]);

  return { getMemoryInfo, isMemoryPressure };
}
