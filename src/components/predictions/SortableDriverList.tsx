import React from 'react';
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
      {...attributes} 
      {...listeners}
      className="bg-white border border-gray-200 p-3 rounded-lg mb-2 flex items-center shadow-sm cursor-grab active:cursor-grabbing touch-manipulation"
    >
      <span className="font-bold text-f1-red w-8">{index + 1}.</span>
      <div className="flex-1">
        <span className="font-semibold text-gray-800">#{driver.number} {driver.name}</span>
        <span className="text-gray-500 text-sm ml-2">({driver.team})</span>
      </div>
      <div className="text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
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
                    <div key={id} className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex items-center opacity-75">
                         <span className="font-bold text-gray-500 w-8">{index + 1}.</span>
                         <span className="font-semibold text-gray-700">#{driver.number} {driver.name}</span>
                         <span className="text-gray-500 text-sm ml-2">({driver.team})</span>
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
