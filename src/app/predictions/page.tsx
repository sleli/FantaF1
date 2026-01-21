'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Driver, Event } from '@prisma/client'
import { PredictionWithDetails } from '@/lib/types'
import PredictionForm from '@/components/predictions/PredictionForm'
import PredictionList from '@/components/predictions/PredictionList'
import PublicLayout from '@/components/layout/PublicLayout'

export default function PredictionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [events, setEvents] = useState<Event[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [predictions, setPredictions] = useState<PredictionWithDetails[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [editingPrediction, setEditingPrediction] = useState<PredictionWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('existing')

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

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      // Carica eventi, piloti e pronostici esistenti in parallelo
      const [eventsRes, driversRes, predictionsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/drivers'),
        fetch('/api/predictions')
      ])

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json()
        setDrivers(driversData.drivers?.filter((d: Driver) => d.active) || [])
      }

      if (predictionsRes.ok) {
        const predictionsData = await predictionsRes.json()
        setPredictions(predictionsData)
      }
    } catch (error) {
      console.error('Errore nel caricamento dati:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  // Filtra eventi disponibili per nuovi pronostici
  const availableEvents = events.filter(event => {
    const hasExistingPrediction = predictions.some(p => p.eventId === event.id)
    const isOpen = event.status === 'UPCOMING' && new Date() < new Date(event.closingDate)
    return !hasExistingPrediction && isOpen
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-f1-red"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <PublicLayout>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-f1-dark">I Miei Pronostici</h1>
          <p className="mt-2 text-gray-600">
            Gestisci i tuoi pronostici per gli eventi di Formula 1
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab('existing')
                  setSelectedEvent(null)
                  setEditingPrediction(null)
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'existing'
                    ? 'border-f1-red text-f1-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pronostici Esistenti ({predictions.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('new')
                  setEditingPrediction(null)
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'new'
                    ? 'border-f1-red text-f1-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Nuovo Pronostico {availableEvents.length > 0 && `(${availableEvents.length})`}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'existing' && !editingPrediction && (
              <PredictionList
                predictions={predictions}
                onEdit={(prediction) => {
                  setEditingPrediction(prediction)
                  setActiveTab('new')
                }}
                onDelete={handleDeletePrediction}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'new' && !editingPrediction && (
              <div>
                {availableEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4">
                      <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun evento disponibile</h3>
                    <p className="text-gray-500">
                      Non ci sono eventi aperti per nuovi pronostici al momento.
                    </p>
                  </div>
                ) : !selectedEvent ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Seleziona un evento per il tuo pronostico:
                    </h3>
                    <div className="grid gap-4">
                      {availableEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-f1-red hover:bg-red-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-f1-dark">{event.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'} - {new Date(event.date).toLocaleDateString('it-IT')}
                              </p>
                              <p className="text-sm text-blue-600 mt-1">
                                Chiusura: {new Date(event.closingDate).toLocaleDateString('it-IT', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
      </div>
    </PublicLayout>
  )
}
