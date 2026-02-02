'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Driver, Event } from '@prisma/client'
import { PredictionWithDetails } from '@/lib/types'
import PredictionForm from '@/components/predictions/PredictionForm'
import PredictionsViewer from '@/components/predictions/PredictionsViewer'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface MyPredictionsViewProps {
  events: Event[]
  drivers: Driver[]
  seasonStatus: {
    hasActiveSeason: boolean
    isEnabled: boolean
  } | null
  initialEventId?: string
}

export default function MyPredictionsView({
  events,
  drivers,
  seasonStatus,
  initialEventId,
}: MyPredictionsViewProps) {
  const { status } = useSession()

  const [predictions, setPredictions] = useState<PredictionWithDetails[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [editingPrediction, setEditingPrediction] = useState<PredictionWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('existing')

  const processedEventRef = useRef(false)

  // Load personal predictions
  useEffect(() => {
    if (status === 'authenticated') {
      loadPredictions()
    }
  }, [status])

  const loadPredictions = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/predictions')
      if (res.ok) {
        if (res.status === 204) {
          setPredictions([])
        } else {
          const data = await res.json()
          setPredictions(data)
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento pronostici:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle deep link to specific event (one-time on initial load)
  useEffect(() => {
    if (initialEventId && events.length > 0 && !isLoading && !processedEventRef.current) {
      processedEventRef.current = true
      const targetEvent = events.find(e => e.id === initialEventId)

      if (targetEvent) {
        const existingPrediction = predictions.find(p => p.eventId === targetEvent.id)

        if (existingPrediction) {
          setEditingPrediction(existingPrediction)
        } else {
          const isOpen = targetEvent.status === 'UPCOMING' && new Date() < new Date(targetEvent.closingDate)
          if (isOpen) {
            setSelectedEvent(targetEvent)
            setActiveTab('new')
          }
        }
      }
    }
  }, [initialEventId, events, predictions, isLoading])

  const handleCreatePrediction = async (predictionData: {
    firstPlaceId: string
    secondPlaceId: string
    thirdPlaceId: string
  }) => {
    if (!selectedEvent) return

    try {
      setIsLoading(true)

      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          ...predictionData
        })
      })

      if (response.ok) {
        const newPrediction = await response.json()
        setPredictions(prev => [newPrediction, ...prev])
        setSelectedEvent(null)
        setActiveTab('existing')
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nella creazione del pronostico')
      }
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore nella creazione del pronostico')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePrediction = async (predictionData: {
    firstPlaceId: string
    secondPlaceId: string
    thirdPlaceId: string
  }) => {
    if (!editingPrediction) return

    try {
      setIsLoading(true)

      const response = await fetch(`/api/predictions/${editingPrediction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(predictionData)
      })

      if (response.ok) {
        const updatedPrediction = await response.json()
        setPredictions(prev =>
          prev.map(p => p.id === updatedPrediction.id ? updatedPrediction : p)
        )
        setEditingPrediction(null)
        setActiveTab('existing')
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nella modifica del pronostico')
      }
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore nella modifica del pronostico')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePrediction = async (predictionId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo pronostico?')) return

    try {
      setIsLoading(true)

      const response = await fetch(`/api/predictions/${predictionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPredictions(prev => prev.filter(p => p.id !== predictionId))
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'eliminazione del pronostico')
      }
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore nell\'eliminazione del pronostico')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter available events for new predictions
  const availableEvents = events.filter(event => {
    const hasExistingPrediction = predictions.some(p => p.eventId === event.id)
    const isOpen = event.status === 'UPCOMING' && new Date() < new Date(event.closingDate)
    return !hasExistingPrediction && isOpen
  })

  // Season guard: user not enabled
  if (seasonStatus && !seasonStatus.isEnabled) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Accesso limitato
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Non sei abilitato a partecipare alla stagione corrente.
          Contatta un amministratore per richiedere l&apos;abilitazione.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex rounded-xl bg-muted/40 p-1 border border-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('existing')
              setSelectedEvent(null)
              setEditingPrediction(null)
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'existing'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pronostici Esistenti ({predictions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('new')
              setEditingPrediction(null)
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'new'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nuovo Pronostico {availableEvents.length > 0 && `(${availableEvents.length})`}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'existing' && !editingPrediction && (
          <PredictionsViewer
            personalPredictions={predictions}
            drivers={drivers}
            isLoading={isLoading}
            onEdit={(prediction) => {
              setEditingPrediction(prediction)
              setActiveTab('new')
            }}
            onDelete={handleDeletePrediction}
          />
        )}

        {activeTab === 'new' && !editingPrediction && (
          <div>
            {availableEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4">
                  <svg className="w-full h-full text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Nessun evento disponibile</h3>
                <p className="text-muted-foreground">
                  Non ci sono eventi aperti per nuovi pronostici al momento.
                </p>
              </div>
            ) : !selectedEvent ? (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Seleziona un evento per il tuo pronostico:</h3>
                <div className="grid gap-4">
                  {availableEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/10 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            {(event as any).countryFlag && (
                              <img src={(event as any).countryFlag} alt="" className="w-6 h-4 object-cover rounded-sm" />
                            )}
                            {event.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'} - {new Date(event.date).toLocaleDateString('it-IT')}
                          </p>
                          <p className="text-sm text-primary mt-1">
                            Chiusura: {new Date(event.closingDate).toLocaleDateString('it-IT', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <PredictionForm
                event={selectedEvent}
                drivers={drivers}
                onSubmit={handleCreatePrediction}
                isLoading={isLoading}
                lastPrediction={predictions.length > 0 ? { rankings: predictions[0].rankings as string[] } : undefined}
              />
            )}
          </div>
        )}

        {editingPrediction && (
          <PredictionForm
            event={editingPrediction.event}
            drivers={drivers}
            onSubmit={handleUpdatePrediction}
            initialPrediction={{
              firstPlaceId: editingPrediction.firstPlaceId || undefined,
              secondPlaceId: editingPrediction.secondPlaceId || undefined,
              thirdPlaceId: editingPrediction.thirdPlaceId || undefined,
              rankings: (editingPrediction.rankings as string[]) || undefined
            }}
            isLoading={isLoading}
            isModifying={true}
          />
        )}
      </div>
    </div>
  )
}
