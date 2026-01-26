'use client';

import { useState, useMemo, useCallback } from 'react';
import { Driver } from '@prisma/client';
import MobileDrawer, { DrawerContent, DrawerListItem } from '@/components/ui/MobileDrawer';
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

  // Filter drivers based on search and excluded IDs
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
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
    });
  }, [drivers, excludedDriverIds, searchQuery]);

  // Group drivers by team
  const driversByTeam = useMemo(() => {
    const grouped = new Map<string, Driver[]>();

    filteredDrivers.forEach((driver) => {
      const existing = grouped.get(driver.team) || [];
      grouped.set(driver.team, [...existing, driver]);
    });

    return grouped;
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca pilota o team..."
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

      {/* Driver Grid */}
      <DrawerContent className="pb-6">
        {filteredDrivers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Nessun pilota trovato</p>
          </div>
        ) : searchQuery ? (
          // Flat list when searching
          <div className="grid grid-cols-2 gap-3">
            {filteredDrivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                isSelected={selectedDriver?.id === driver.id}
                onSelect={() => handleSelect(driver)}
              />
            ))}
          </div>
        ) : (
          // Grouped by team when not searching
          <div className="space-y-6">
            {Array.from(driversByTeam.entries()).map(([team, teamDrivers]) => (
              <div key={team}>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  {team}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {teamDrivers.map((driver) => (
                    <DriverCard
                      key={driver.id}
                      driver={driver}
                      isSelected={selectedDriver?.id === driver.id}
                      onSelect={() => handleSelect(driver)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DrawerContent>
    </MobileDrawer>
  );
}

// Driver card component
function DriverCard({
  driver,
  isSelected,
  onSelect,
}: {
  driver: Driver;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative flex flex-col items-center p-4 rounded-xl
        border transition-all duration-200
        touch-active min-h-[100px]
        ${
          isSelected
            ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(225,6,0,0.2)]'
            : 'bg-surface-2 border-border hover:border-primary/50 hover:bg-surface-3'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <CheckIcon className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Driver number badge */}
      <div
        className={`
          absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold
          ${isSelected ? 'bg-primary text-white' : 'bg-surface-3 text-muted-foreground'}
        `}
      >
        #{driver.number}
      </div>

      {/* Driver avatar */}
      <DriverAvatar
        imageUrl={driver.imageUrl}
        name={driver.name}
        size="lg"
        className="mb-2"
      />

      {/* Driver name */}
      <span
        className={`
          text-sm font-bold text-center leading-tight
          ${isSelected ? 'text-primary' : 'text-foreground'}
        `}
      >
        {driver.name.split(' ').pop()}
      </span>

      {/* Team (truncated) */}
      <span className="text-[10px] text-muted-foreground text-center truncate w-full mt-0.5">
        {driver.team}
      </span>
    </button>
  );
}

// Hook for managing picker state
import { useMemo as useMemoHook, useState as useStateHook } from 'react';

interface UseDriverPickerOptions {
  drivers: Driver[];
  excludedDriverIds?: string[];
}

export function useDriverPicker({ drivers, excludedDriverIds = [] }: UseDriverPickerOptions) {
  const [isOpen, setIsOpen] = useStateHook(false);
  const [selectedPosition, setSelectedPosition] = useStateHook<number | null>(null);

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
