import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Driver } from '@prisma/client';

// Sortable Item Component
function SortableItem({ id, driver, index }: { id: string, driver: Driver, index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-lg flex items-center gap-3 px-3 py-2 touch-manipulation"
    >
      <div className="w-9 text-right tabular-nums text-sm text-muted-foreground">
        {index + 1}.
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">
          #{driver.number} {driver.name}
        </div>
        <div className="truncate text-xs text-muted-foreground">{driver.team}</div>
      </div>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Trascina ${driver.name}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
    </div>
  );
}

interface SortableDriverListProps {
  drivers: Driver[];
  orderedDriverIds: string[];
  onChange: (newOrder: string[]) => void;
  disabled?: boolean;
}

export default function SortableDriverList({ drivers, orderedDriverIds, onChange, disabled }: SortableDriverListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
        const oldIndex = orderedDriverIds.indexOf(active.id as string);
        const newIndex = orderedDriverIds.indexOf(over.id as string);
        onChange(arrayMove(orderedDriverIds, oldIndex, newIndex));
    }
  }

  // Helper to get driver obj
  const getDriver = (id: string) => drivers.find(d => d.id === id);

  if (disabled) {
      return (
          <div className="space-y-2">
              {orderedDriverIds.map((id, index) => {
                  const driver = getDriver(id);
                  if (!driver) return null;
                  return (
                    <div key={id} className="bg-muted border border-border rounded-lg flex items-center gap-3 px-3 py-2 opacity-75">
                         <div className="w-9 text-right tabular-nums text-sm text-muted-foreground">{index + 1}.</div>
                         <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground">#{driver.number} {driver.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{driver.team}</div>
                         </div>
                         <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground">
                          <Bars3Icon className="h-5 w-5" />
                         </div>
                    </div>
                  )
              })}
          </div>
      )
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={orderedDriverIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
            {orderedDriverIds.map((id, index) => {
                const driver = getDriver(id);
                if (!driver) return null; // Should not happen
                return <SortableItem key={id} id={id} driver={driver} index={index} />;
            })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
