'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Driver, Event } from '@prisma/client'
import { PredictionWithDetails } from '@/lib/types'
import PredictionForm from '@/components/predictions/PredictionForm'
import PredictionsViewer from '@/components/predictions/PredictionsViewer'
import Button from '@/components/ui/Button'
import { ExclamationTriangleIcon, ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'

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
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  const handleBackToList = () => {
    setSelectedEvent(null)
    setEditingPrediction(null)
    setShowEventPicker(false)
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

  // Mode: Form (creating or editing)
  if (selectedEvent || editingPrediction) {
    return (
      <div>
        <button
          type="button"
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Torna alla lista
        </button>

        {selectedEvent && (
          <PredictionForm
            event={selectedEvent}
            drivers={drivers}
            onSubmit={handleCreatePrediction}
            isLoading={isLoading}
            lastPrediction={predictions.length > 0 ? { rankings: predictions[0].rankings as string[] } : undefined}
          />
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
    )
  }

  // Mode: Event picker (multiple available events)
  if (showEventPicker) {
    return (
      <div>
        <button
          type="button"
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Torna alla lista
        </button>

        <h3 className="text-lg font-medium text-foreground mb-4">Seleziona un evento per il tuo pronostico:</h3>
        <div className="grid gap-4">
          {availableEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => {
                setSelectedEvent(event)
                setShowEventPicker(false)
              }}
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
    )
  }

  // Mode: Default list view with CTA
  return (
    <div className="space-y-6">
      {/* New prediction CTA */}
      {availableEvents.length === 1 && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                {(availableEvents[0] as any).countryFlag && (
                  <img src={(availableEvents[0] as any).countryFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                )}
                {availableEvents[0].name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chiusura: {new Date(availableEvents[0].closingDate).toLocaleDateString('it-IT', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setSelectedEvent(availableEvents[0])}
            >
              Inserisci Pronostico
            </Button>
          </div>
        </div>
      )}

      {availableEvents.length > 1 && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {availableEvents.length} eventi disponibili
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inserisci un nuovo pronostico
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowEventPicker(true)}
            >
              Scegli Evento
            </Button>
          </div>
        </div>
      )}

      {/* Predictions list */}
      <PredictionsViewer
        predictions={predictions}
        drivers={drivers}
        isLoading={isLoading}
        onEdit={(prediction) => setEditingPrediction(prediction)}
        onDelete={handleDeletePrediction}
      />
    </div>
  )
}
