'use client';

import { useState } from 'react';

interface DriverAvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export default function DriverAvatar({
  imageUrl,
  name,
  size = 'md',
  className = '',
}: DriverAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const showImage = imageUrl && !hasError;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full overflow-hidden
        bg-surface-3 flex items-center justify-center
        font-bold text-muted-foreground
        flex-shrink-0
        ${className}
      `}
    >
      {showImage ? (
        <>
          {!isLoaded && (
            <span className="absolute">{initials}</span>
          )}
          <img
            src={imageUrl}
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            loading="lazy"
          />
        </>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
