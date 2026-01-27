'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Driver } from '@prisma/client';
import MobileDrawer, { DrawerContent } from '@/components/ui/MobileDrawer';
import Input from '@/components/ui/Input';
import DriverAvatar from '@/components/ui/DriverAvatar';
import { MagnifyingGlassIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface DriverPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (driver: Driver) => void;
  drivers: Driver[];
  selectedDriver?: Driver | null;
  excludedDriverIds?: string[];
  title?: string;
  position?: number;
}

export default function DriverPickerSheet({
  isOpen,
  onClose,
  onSelect,
  drivers,
  selectedDriver,
  excludedDriverIds = [],
  title = 'Seleziona pilota',
  position,
}: DriverPickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to allow drawer animation
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Filter drivers based on search and excluded IDs
  const filteredDrivers = useMemo(() => {
    return drivers
      .filter((driver) => {
        // Check if excluded
        if (excludedDriverIds.includes(driver.id)) {
          return false;
        }

        // Check search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            driver.name.toLowerCase().includes(query) ||
            driver.team.toLowerCase().includes(query) ||
            driver.number.toString().includes(query)
          );
        }

        return true;
      })
      // Sort alphabetically by name
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [drivers, excludedDriverIds, searchQuery]);

  // Get unique first letters for alphabet rail
  const alphabetLetters = useMemo(() => {
    const letters = new Set(
      filteredDrivers.map((d) => d.name.charAt(0).toUpperCase())
    );
    return Array.from(letters).sort();
  }, [filteredDrivers]);

  const handleSelect = useCallback(
    (driver: Driver) => {
      onSelect(driver);
      setSearchQuery('');
      onClose();
    },
    [onSelect, onClose]
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  // Scroll to letter
  const scrollToLetter = useCallback((letter: string) => {
    if (!listRef.current) return;

    const element = listRef.current.querySelector(
      `[data-letter="${letter}"]`
    ) as HTMLElement;

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const positionLabel = position
    ? position === 1
      ? '1°'
      : position === 2
      ? '2°'
      : position === 3
      ? '3°'
      : `${position}°`
    : null;

  return (
    <MobileDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title={positionLabel ? `${positionLabel} Posizione` : title}
      description="Tocca per selezionare"
    >
      {/* Search Input */}
      <div className="px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
        <div className="relative">
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca pilota..."
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            className="pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                p-1 rounded-full text-muted-foreground
                hover:text-foreground hover:bg-surface-3
                transition-colors
              "
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Driver List - Single Column, Open Design */}
      <div className="relative flex">
        {/* Main list */}
        <div ref={listRef} className="flex-1">
          <DrawerContent className="py-2 px-0">
            {filteredDrivers.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Nessun pilota trovato</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filteredDrivers.map((driver, index) => {
                  const isFirstOfLetter =
                    index === 0 ||
                    driver.name.charAt(0).toUpperCase() !==
                      filteredDrivers[index - 1]?.name.charAt(0).toUpperCase();

                  return (
                    <DriverListItem
                      key={driver.id}
                      driver={driver}
                      isSelected={selectedDriver?.id === driver.id}
                      onSelect={() => handleSelect(driver)}
                      dataLetter={
                        isFirstOfLetter
                          ? driver.name.charAt(0).toUpperCase()
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </DrawerContent>
        </div>

        {/* Alphabet Rail - Only show when not searching and list is long enough */}
        {!searchQuery && filteredDrivers.length > 10 && (
          <div className="absolute right-0 top-0 bottom-0 w-6 flex flex-col justify-center py-2 bg-gradient-to-l from-card via-card to-transparent">
            <div className="flex flex-col items-center gap-0.5">
              {alphabetLetters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => scrollToLetter(letter)}
                  className="
                    w-5 h-5 text-[10px] font-bold text-muted-foreground
                    hover:text-primary active:text-primary
                    transition-colors touch-manipulation
                  "
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileDrawer>
  );
}

// Single column driver list item - Open Design
function DriverListItem({
  driver,
  isSelected,
  onSelect,
  dataLetter,
}: {
  driver: Driver;
  isSelected: boolean;
  onSelect: () => void;
  dataLetter?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-letter={dataLetter}
      className={`
        w-full flex items-center gap-3 px-4 py-3
        text-left transition-all duration-150
        touch-active min-h-[64px]
        ${
          isSelected
            ? 'bg-primary/10'
            : 'hover:bg-surface-3 active:bg-surface-3'
        }
      `}
    >
      {/* Driver avatar */}
      <DriverAvatar
        imageUrl={driver.imageUrl}
        name={driver.name}
        size="md"
      />

      {/* Driver info */}
      <div className="flex-1 min-w-0">
        <div
          className={`
            font-semibold truncate
            ${isSelected ? 'text-primary' : 'text-foreground'}
          `}
        >
          {driver.name}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-bold">#{driver.number}</span>
          <span className="opacity-50">·</span>
          <span className="truncate">{driver.team}</span>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <CheckIcon className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
}

// Hook for managing picker state
export function useDriverPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  const openPicker = useCallback((position: number) => {
    setSelectedPosition(position);
    setIsOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setIsOpen(false);
    setSelectedPosition(null);
  }, []);

  return {
    isOpen,
    selectedPosition,
    openPicker,
    closePicker,
    setIsOpen,
  };
}
