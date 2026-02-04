'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Event, Driver } from '@prisma/client'
import { PredictionWithDetails } from '@/lib/types'
import PredictionsViewer from '@/components/predictions/PredictionsViewer'
import EventPickerSheet from '@/components/predictions/EventPickerSheet'
import Badge from '@/components/ui/Badge'
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface AllPredictionsViewProps {
  events: Event[]
  drivers: Driver[]
  initialEventId?: string
}

export default function AllPredictionsView({
  events,
  drivers,
  initialEventId,
}: AllPredictionsViewProps) {
  const { status } = useSession()

  const [allPredictions, setAllPredictions] = useState<PredictionWithDetails[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || 'all')
  const [isLoading, setIsLoading] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId]
  )

  // Load predictions when event filter changes
  useEffect(() => {
    if (status === 'authenticated') {
      loadPredictions()
    }
  }, [selectedEventId, status])

  const loadPredictions = async () => {
    try {
      setIsLoading(true)

      const url = selectedEventId === 'all'
        ? '/api/predictions/all'
        : `/api/predictions/all?eventId=${selectedEventId}`

      const res = await fetch(url)

      if (res.ok) {
        if (res.status === 204) {
          setAllPredictions([])
        } else {
          const predictionsData = await res.json()
          setAllPredictions(predictionsData)
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento pronostici:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Event filter trigger */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
        >
          {selectedEvent ? (
            <>
              {(selectedEvent as any).countryFlag && (
                <img
                  src={(selectedEvent as any).countryFlag}
                  alt=""
                  className="w-7 h-5 object-cover rounded-sm shadow-sm flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0 text-left">
                <span className="text-sm font-semibold text-foreground truncate block">
                  {selectedEvent.name}
                </span>
              </div>
              <Badge variant={selectedEvent.type === 'RACE' ? 'race' : 'sprint'} size="sm">
                {selectedEvent.type === 'RACE' ? 'GP' : 'Sprint'}
              </Badge>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                <GlobeAltIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left text-sm font-semibold text-foreground">
                Tutti gli eventi
              </span>
            </>
          )}
          <ChevronDownIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>
      </div>

      {/* Event picker sheet */}
      <EventPickerSheet
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={setSelectedEventId}
        events={events}
        selectedEventId={selectedEventId}
      />

      {/* Predictions list */}
      <PredictionsViewer
        predictions={allPredictions}
        drivers={drivers}
        isLoading={isLoading}
        showUserName={true}
      />
    </div>
  )
}
