'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Event } from '@prisma/client'
import { PredictionWithDetails } from '@/lib/types'
import PublicLayout from '@/components/layout/PublicLayout'
import AllPredictionsList from '@/components/predictions/AllPredictionsList'

export default function AllPredictionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [events, setEvents] = useState<Event[]>([])
  const [predictions, setPredictions] = useState<PredictionWithDetails[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect se non autenticato
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Carica dati iniziali
  useEffect(() => {
    if (status === 'authenticated') {
      loadInitialData()
    }
  }, [status])

  // Carica pronostici quando cambia l'evento selezionato
  useEffect(() => {
    if (status === 'authenticated') {
      loadPredictions()
    }
  }, [selectedEventId, status])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      // Carica eventi
      const eventsRes = await fetch('/api/events')
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }
    } catch (error) {
      console.error('Errore nel caricamento eventi:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPredictions = async () => {
    try {
      setIsLoading(true)
      
      const url = selectedEventId === 'all' 
        ? '/api/predictions/all'
        : `/api/predictions/all?eventId=${selectedEventId}`
      
      const response = await fetch(url)
      if (response.ok) {
        const predictionsData = await response.json()
        setPredictions(predictionsData)
      }
    } catch (error) {
      console.error('Errore nel caricamento pronostici:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </PublicLayout>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pronostici di Tutti i Giocatori
          </h1>
          <p className="text-gray-600">
            Visualizza i pronostici di tutti i giocatori per ogni evento.
          </p>
        </div>

        {/* Filtro per evento */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label htmlFor="event-filter" className="text-sm font-medium text-gray-700">
              Filtra per evento:
            </label>
            <select
              id="event-filter"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">Tutti gli eventi</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.type === 'RACE' ? 'Gran Premio' : 'Sprint'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista pronostici */}
        <div className="bg-white rounded-lg shadow-md">
          <AllPredictionsList
            predictions={predictions}
            isLoading={isLoading}
            selectedEventId={selectedEventId}
          />
        </div>
      </div>
    </PublicLayout>
  )
}
