'use client';

import { CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface DashboardTabBarProps {
  activeTab: 'upcoming' | 'past';
  onTabChange: (tab: 'upcoming' | 'past') => void;
}

export default function DashboardTabBar({ activeTab, onTabChange }: DashboardTabBarProps) {
  return (
    <div className="sticky top-16 z-30 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-2 bg-background/80 backdrop-blur-md md:bg-transparent md:backdrop-blur-none md:static md:mx-0 md:px-0">
      <div className="flex justify-center">
        <div className="bg-muted/30 p-1 rounded-full border border-border inline-flex relative w-full max-w-[380px]">
          {/* Sliding pill indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-card shadow-sm transition-all duration-300 ease-in-out"
            style={{
              left: activeTab === 'upcoming' ? '4px' : '50%',
              width: 'calc(50% - 4px)',
            }}
          />

          <button
            onClick={() => onTabChange('upcoming')}
            className={`relative z-10 flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'upcoming'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Prossimi
          </button>

          <button
            onClick={() => onTabChange('past')}
            className={`relative z-10 flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'past'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            Passati
          </button>
        </div>
      </div>
    </div>
  );
}
