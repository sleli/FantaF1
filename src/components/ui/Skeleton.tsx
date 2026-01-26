'use client';

import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'shimmer' | 'pulse' | 'none';
}

export default function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
  animation = 'shimmer',
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-surface-3';

  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animations = {
    shimmer: 'skeleton',
    pulse: 'animate-pulse',
    none: '',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseStyles} ${variants[variant]} ${animations[animation]}`}
            style={{
              ...style,
              width: index === lines - 1 ? '70%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${animations[animation]} ${className}`}
      style={style}
      {...props}
    />
  );
}

// Preset skeleton components for common use cases
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 rounded-xl border border-border bg-card ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton lines={3} />
    </div>
  );
}

export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton width="70%" height={14} className="mb-1" />
        <Skeleton width="50%" height={12} />
      </div>
      <Skeleton width={60} height={24} variant="rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 p-3 bg-surface-2 rounded-lg">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${100 / cols}%`} height={16} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} width={`${100 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonEventCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 rounded-xl border border-border bg-card ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Skeleton width="70%" height={20} className="mb-2" />
          <Skeleton width="50%" height={14} />
        </div>
        <Skeleton width={60} height={24} variant="rounded" />
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <Skeleton width={80} height={32} variant="rounded" />
        <Skeleton width="60%" height={14} />
      </div>
    </div>
  );
}

export function SkeletonLeaderboard({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
        >
          <Skeleton width={28} height={28} variant="circular" />
          <Skeleton width={36} height={36} variant="circular" />
          <div className="flex-1">
            <Skeleton width="60%" height={16} className="mb-1" />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton width={50} height={24} variant="rounded" />
        </div>
      ))}
    </div>
  );
}
