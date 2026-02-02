'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Event, Driver } from '@prisma/client'
import { PredictionWithDetails } from '@/lib/types'
import Card from '@/components/ui/Card'
import PredictionsViewer from '@/components/predictions/PredictionsViewer'

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
  const [personalPredictions, setPersonalPredictions] = useState<PredictionWithDetails[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || 'all')
  const [isLoading, setIsLoading] = useState(false)

  // Load predictions when event filter changes
  useEffect(() => {
    if (status === 'authenticated') {
      loadPredictions()
    }
  }, [selectedEventId, status])

  const loadPredictions = async () => {
    try {
      setIsLoading(true)

      const allUrl = selectedEventId === 'all'
        ? '/api/predictions/all'
        : `/api/predictions/all?eventId=${selectedEventId}`

      const personalUrl = selectedEventId === 'all'
        ? '/api/predictions'
        : `/api/predictions?eventId=${selectedEventId}`

      const [allRes, personalRes] = await Promise.all([
        fetch(allUrl),
        fetch(personalUrl),
      ])

      if (allRes.ok) {
        if (allRes.status === 204) {
          setAllPredictions([])
        } else {
          const predictionsData = await allRes.json()
          setAllPredictions(predictionsData)
        }
      }

      if (personalRes.ok) {
        if (personalRes.status === 204) {
          setPersonalPredictions([])
        } else {
          const personalData = await personalRes.json()
          setPersonalPredictions(personalData || [])
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
      {/* Event filter */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <label htmlFor="event-filter" className="text-sm font-medium text-foreground">
            Filtra per evento:
          </label>
          <select
            id="event-filter"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Tutti gli eventi</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.type === 'RACE' ? 'Gran Premio' : 'Sprint'})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Predictions list */}
      <PredictionsViewer
        personalPredictions={personalPredictions}
        allPredictions={allPredictions}
        drivers={drivers}
        isLoading={isLoading}
        defaultScope="all"
      />
    </div>
  )
}
