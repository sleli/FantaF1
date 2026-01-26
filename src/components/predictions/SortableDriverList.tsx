'use client';

import React, { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Driver } from '@prisma/client';
import DriverAvatar from '@/components/ui/DriverAvatar';

// Sortable Item Component
function SortableItem({
  id,
  driver,
  index,
  isDragging,
  isOverlay,
}: {
  id: string;
  driver: Driver;
  index: number;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const itemClasses = `
    bg-card border rounded-lg flex items-center
    gap-2 px-2 py-2
    md:gap-3 md:px-3 md:py-3 md:rounded-xl
    touch-manipulation transition-all duration-200
    ${
      isDragging || isOverlay
        ? 'border-primary shadow-[0_0_20px_rgba(225,6,0,0.3)] scale-[1.02] z-50 bg-surface-2'
        : 'border-border hover:border-primary/30'
    }
    ${isOver && !isDragging ? 'border-primary border-dashed' : ''}
    ${index < 3 ? 'bg-surface-2' : ''}
  `;

  return (
    <div ref={setNodeRef} style={style} className={itemClasses}>
      {/* Position number */}
      <div
        className={`
          w-7 h-7 md:w-10 md:h-10 rounded-md md:rounded-lg flex items-center justify-center
          font-bold text-xs md:text-sm tabular-nums flex-shrink-0
          ${
            index < 3
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-3 text-muted-foreground'
          }
        `}
      >
        {index + 1}
      </div>

      {/* Driver avatar */}
      <div className="flex-shrink-0">
        <DriverAvatar
          imageUrl={driver.imageUrl}
          name={driver.name}
          size="sm"
        />
      </div>

      {/* Driver info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground">
            #{driver.number}
          </span>
          <span className="text-sm md:text-base font-semibold md:font-bold text-foreground truncate">
            {driver.name}
          </span>
        </div>
        <div className="text-[10px] md:text-xs text-muted-foreground truncate">
          {driver.team}
        </div>
      </div>

      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Trascina ${driver.name}`}
        className={`
          inline-flex items-center justify-center flex-shrink-0
          w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl
          border border-border bg-surface-3
          text-muted-foreground
          hover:text-foreground hover:bg-surface-4 hover:border-primary/30
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
          transition-all duration-200
          touch-none cursor-grab active:cursor-grabbing
          ${isDragging ? 'bg-primary text-white border-primary' : ''}
        `}
      >
        <Bars3Icon className="h-5 w-5 md:h-6 md:w-6" />
      </button>
    </div>
  );
}

// Static item for disabled state
function StaticItem({ driver, index }: { driver: Driver; index: number }) {
  return (
    <div
      className={`
        bg-muted border border-border rounded-lg md:rounded-xl
        flex items-center gap-2 px-2 py-2 md:gap-3 md:px-3 md:py-3 opacity-60
        ${index < 3 ? 'bg-surface-2' : ''}
      `}
    >
      <div
        className={`
          w-7 h-7 md:w-10 md:h-10 rounded-md md:rounded-lg flex items-center justify-center
          font-bold text-xs md:text-sm tabular-nums flex-shrink-0
          ${
            index < 3
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-3 text-muted-foreground'
          }
        `}
      >
        {index + 1}
      </div>
      <div className="flex-shrink-0">
        <DriverAvatar
          imageUrl={driver.imageUrl}
          name={driver.name}
          size="sm"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground">
            #{driver.number}
          </span>
          <span className="text-sm md:text-base font-semibold md:font-bold text-foreground truncate">
            {driver.name}
          </span>
        </div>
        <div className="text-[10px] md:text-xs text-muted-foreground truncate">
          {driver.team}
        </div>
      </div>
      <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
        <Bars3Icon className="h-5 w-5 md:h-6 md:w-6" />
      </div>
    </div>
  );
}

interface SortableDriverListProps {
  drivers: Driver[];
  orderedDriverIds: string[];
  onChange: (newOrder: string[]) => void;
  disabled?: boolean;
}

export default function SortableDriverList({
  drivers,
  orderedDriverIds,
  onChange,
  disabled,
}: SortableDriverListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = orderedDriverIds.indexOf(active.id as string);
      const newIndex = orderedDriverIds.indexOf(over.id as string);
      onChange(arrayMove(orderedDriverIds, oldIndex, newIndex));
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  // Helper to get driver obj
  const getDriver = (id: string) => drivers.find((d) => d.id === id);

  const activeDriver = activeId ? getDriver(activeId) : null;
  const activeIndex = activeId ? orderedDriverIds.indexOf(activeId) : -1;

  if (disabled) {
    return (
      <div className="space-y-2">
        {orderedDriverIds.map((id, index) => {
          const driver = getDriver(id);
          if (!driver) return null;
          return <StaticItem key={id} driver={driver} index={index} />;
        })}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={orderedDriverIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1.5 md:space-y-2">
          {/* Instructions - hidden on mobile for space */}
          <div className="hidden md:flex text-xs text-muted-foreground mb-3 items-center gap-2">
            <Bars3Icon className="w-4 h-4" />
            <span>Tieni premuto e trascina per riordinare</span>
          </div>

          {/* Single continuous list */}
          {orderedDriverIds.map((id, index) => {
            const driver = getDriver(id);
            if (!driver) return null;
            return (
              <SortableItem
                key={id}
                id={id}
                driver={driver}
                index={index}
                isDragging={activeId === id}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Drag Overlay - Shows the item being dragged */}
      <DragOverlay>
        {activeDriver && (
          <SortableItem
            id={activeId!}
            driver={activeDriver}
            index={activeIndex}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
