'use client';

import { useCallback } from 'react';
import { Event } from '@prisma/client';
import MobileDrawer, { DrawerContent } from '@/components/ui/MobileDrawer';
import Badge from '@/components/ui/Badge';
import { CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface EventPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (eventId: string) => void;
  events: Event[];
  selectedEventId: string;
}

export default function EventPickerSheet({
  isOpen,
  onClose,
  onSelect,
  events,
  selectedEventId,
}: EventPickerSheetProps) {
  const handleSelect = useCallback(
    (eventId: string) => {
      onSelect(eventId);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <MobileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Filtra per evento"
      description="Seleziona un evento per filtrare i pronostici"
    >
      <DrawerContent className="py-2 px-0">
        <div className="divide-y divide-border/30">
          {/* "All events" option */}
          <button
            type="button"
            onClick={() => handleSelect('all')}
            className={`
              w-full flex items-center gap-3 px-4 py-3
              text-left transition-all duration-150
              touch-active min-h-[56px]
              ${selectedEventId === 'all' ? 'bg-primary/10' : 'hover:bg-surface-3 active:bg-surface-3'}
            `}
          >
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
              <GlobeAltIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`font-semibold ${selectedEventId === 'all' ? 'text-primary' : 'text-foreground'}`}>
                Tutti gli eventi
              </span>
            </div>
            {selectedEventId === 'all' && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          {/* Event list */}
          {events.map((event) => {
            const isSelected = selectedEventId === event.id;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => handleSelect(event.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3
                  text-left transition-all duration-150
                  touch-active min-h-[56px]
                  ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-3 active:bg-surface-3'}
                `}
              >
                {/* Country flag or placeholder */}
                <div className="flex-shrink-0">
                  {(event as any).countryFlag ? (
                    <img
                      src={(event as any).countryFlag}
                      alt=""
                      className="w-8 h-6 object-cover rounded-sm shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-6 rounded-sm bg-muted/50" />
                  )}
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {event.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={event.type === 'RACE' ? 'race' : 'sprint'} size="sm">
                      {event.type === 'RACE' ? 'GP' : 'Sprint'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
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
          })}
        </div>
      </DrawerContent>
    </MobileDrawer>
  );
}
