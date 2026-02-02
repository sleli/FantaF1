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

// Position badge component for podium distinction
function PositionBadge({ position }: { position: number }) {
  const isPodium = position <= 3;

  const badgeClasses = isPodium
    ? position === 1
      ? 'bg-accent-gold/20 text-accent-gold'
      : position === 2
      ? 'bg-accent-silver/20 text-accent-silver'
      : 'bg-accent-bronze/20 text-accent-bronze'
    : 'bg-surface-3 text-muted-foreground';

  return (
    <div
      className={`
        w-9 h-9 rounded-full flex items-center justify-center
        font-black text-sm tabular-nums flex-shrink-0
        ${badgeClasses}
      `}
    >
      {position}
    </div>
  );
}

// Sortable Item Component - Open Design (no card borders)
function SortableItem({
  id,
  driver,
  index,
  isDragging,
  isOverlay,
  isLastPodiumItem,
}: {
  id: string;
  driver: Driver;
  index: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  isLastPodiumItem?: boolean;
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

  const position = index + 1;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`
          flex items-center gap-3 py-4 px-2
          transition-all duration-200
          ${
            isDragging || isOverlay
              ? 'bg-surface-2 rounded-xl shadow-[0_0_30px_rgba(225,6,0,0.15)] scale-[1.02] z-50 relative'
              : ''
          }
          ${isOver && !isDragging ? 'bg-surface-2/50' : ''}
        `}
      >
        {/* Position badge */}
        <PositionBadge position={position} />

        {/* Driver avatar - always visible, size md */}
        <DriverAvatar
          imageUrl={driver.imageUrl}
          name={driver.name}
          size="md"
        />

        {/* Driver info */}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground truncate">
            {driver.name}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-bold">#{driver.number}</span>
            <span className="opacity-50">·</span>
            <span className="truncate">{driver.team}</span>
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
            w-10 h-10 rounded-xl
            text-muted-foreground
            hover:text-foreground hover:bg-surface-3
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
            transition-all duration-200
            touch-none cursor-grab active:cursor-grabbing
            ${isDragging || isOverlay ? 'text-primary' : ''}
          `}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      {/* Divider - solid after podium, dashed for others */}
      {isLastPodiumItem ? (
        <div className="border-b border-dashed border-primary/50 mx-2" />
      ) : (
        <div className="border-b border-dashed border-border/40 mx-2" />
      )}
    </div>
  );
}

// Static item for disabled state - Open Design
function StaticItem({
  driver,
  index,
  isLastPodiumItem,
}: {
  driver: Driver;
  index: number;
  isLastPodiumItem?: boolean;
}) {
  const position = index + 1;

  return (
    <div className="opacity-60">
      <div className="flex items-center gap-3 py-4 px-2">
        <PositionBadge position={position} />

        <DriverAvatar
          imageUrl={driver.imageUrl}
          name={driver.name}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground truncate">
            {driver.name}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-bold">#{driver.number}</span>
            <span className="opacity-50">·</span>
            <span className="truncate">{driver.team}</span>
          </div>
        </div>

        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground">
          <Bars3Icon className="h-5 w-5" />
        </div>
      </div>

      {isLastPodiumItem ? (
        <div className="border-b border-dashed border-primary/50 mx-2" />
      ) : (
        <div className="border-b border-dashed border-border/40 mx-2" />
      )}
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
        delay: 100, // Reduced from 200ms for faster response
        tolerance: 5, // More precise
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
      <div>
        {orderedDriverIds.map((id, index) => {
          const driver = getDriver(id);
          if (!driver) return null;
          return (
            <StaticItem
              key={id}
              driver={driver}
              index={index}
              isLastPodiumItem={index === 2}
            />
          );
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
        <div>
          {/* Mobile instructions - now visible */}
          <div className="flex md:hidden text-xs text-muted-foreground mb-3 items-center gap-2 px-2">
            <Bars3Icon className="w-4 h-4" />
            <span>Tieni premuto e trascina per riordinare</span>
          </div>

          {/* Desktop instructions */}
          <div className="hidden md:flex text-xs text-muted-foreground mb-3 items-center gap-2 px-2">
            <Bars3Icon className="w-4 h-4" />
            <span>Trascina per riordinare la griglia</span>
          </div>

          {/* Driver list - open design with dividers */}
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
                isLastPodiumItem={index === 2}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Drag Overlay - Shows the item being dragged */}
      <DragOverlay>
        {activeDriver && (
          <div className="bg-surface-2 rounded-xl shadow-[0_0_30px_rgba(225,6,0,0.25)] scale-[1.03]">
            <div className="flex items-center gap-3 py-4 px-2">
              <PositionBadge position={activeIndex + 1} />

              <DriverAvatar
                imageUrl={activeDriver.imageUrl}
                name={activeDriver.name}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground truncate">
                  {activeDriver.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold">#{activeDriver.number}</span>
                  <span className="opacity-50">·</span>
                  <span className="truncate">{activeDriver.team}</span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary">
                <Bars3Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
