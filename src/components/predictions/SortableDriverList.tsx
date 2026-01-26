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
  DragOverEvent,
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
import Badge from '@/components/ui/Badge';

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

  // Podium badge for top 3
  const getPodiumBadge = (pos: number) => {
    if (pos === 0)
      return (
        <Badge variant="gold" size="sm">
          1°
        </Badge>
      );
    if (pos === 1)
      return (
        <Badge variant="silver" size="sm">
          2°
        </Badge>
      );
    if (pos === 2)
      return (
        <Badge variant="bronze" size="sm">
          3°
        </Badge>
      );
    return null;
  };

  const itemClasses = `
    bg-card border rounded-xl flex items-center gap-3 px-3 py-3
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
          w-10 h-10 rounded-lg flex items-center justify-center
          font-bold text-sm tabular-nums
          ${
            index < 3
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-3 text-muted-foreground'
          }
        `}
      >
        {index + 1}
      </div>

      {/* Driver info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-muted-foreground">
            #{driver.number}
          </span>
          <span className="font-bold text-foreground truncate">
            {driver.name}
          </span>
          {getPodiumBadge(index)}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {driver.team}
        </div>
      </div>

      {/* Drag handle - larger touch target */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Trascina ${driver.name}`}
        className={`
          inline-flex items-center justify-center
          w-12 h-12 rounded-xl
          border border-border bg-surface-3
          text-muted-foreground
          hover:text-foreground hover:bg-surface-4 hover:border-primary/30
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
          transition-all duration-200
          touch-none cursor-grab active:cursor-grabbing
          ${isDragging ? 'bg-primary text-white border-primary' : ''}
        `}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>
    </div>
  );
}

// Static item for disabled state
function StaticItem({ driver, index }: { driver: Driver; index: number }) {
  return (
    <div
      className={`
        bg-muted border border-border rounded-xl
        flex items-center gap-3 px-3 py-3 opacity-60
        ${index < 3 ? 'bg-surface-2' : ''}
      `}
    >
      <div
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          font-bold text-sm tabular-nums
          ${
            index < 3
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-3 text-muted-foreground'
          }
        `}
      >
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-muted-foreground">
            #{driver.number}
          </span>
          <span className="font-bold text-foreground truncate">
            {driver.name}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {driver.team}
        </div>
      </div>
      <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center text-muted-foreground">
        <Bars3Icon className="h-6 w-6" />
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
        <div className="space-y-2">
          {/* Instructions */}
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <Bars3Icon className="w-4 h-4" />
            <span>Tieni premuto e trascina per riordinare</span>
          </div>

          {/* Top 3 section */}
          <div className="space-y-2 mb-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span>Podio</span>
            </div>
            {orderedDriverIds.slice(0, 3).map((id, index) => {
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

          {/* Rest of grid */}
          {orderedDriverIds.length > 3 && (
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Resto della griglia
              </div>
              {orderedDriverIds.slice(3).map((id, index) => {
                const driver = getDriver(id);
                if (!driver) return null;
                return (
                  <SortableItem
                    key={id}
                    id={id}
                    driver={driver}
                    index={index + 3}
                    isDragging={activeId === id}
                  />
                );
              })}
            </div>
          )}
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
