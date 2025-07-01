import React, { useState, useEffect } from 'react'
import { TrophyIcon, UserIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline'

type LeaderboardUser = {
  position: number
  user: {
    id: string
    name: string | null
    email: string | null
  }
  totalPoints: number
  eventCount: number
  averagePoints: number
}

type EventLeaderboardEntry = {
  user: {
    id: string
    name: string | null
    email: string | null
  }
  prediction: {
    id: string
    firstPlace: { name: string; number: number; team: string }
    secondPlace: { name: string; number: number; team: string }
    thirdPlace: { name: string; number: number; team: string }
    points: number | null
  } | null
  points: number | null
}

type Event = {
  id: string
  name: string
  type: 'RACE' | 'SPRINT'
  status: string
  date: string
}

interface LeaderboardProps {
  currentUserId: string
}

export default function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [generalLeaderboard, setGeneralLeaderboard] = useState<LeaderboardUser[]>([])
  const [eventLeaderboard, setEventLeaderboard] = useState<EventLeaderboardEntry[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [completedEvents, setCompletedEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState<'general' | 'event'>('general')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadGeneralLeaderboard()
    loadCompletedEvents()
  }, [])

  const loadGeneralLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/leaderboard')
      if (response.ok) {
        const data = await response.json()
        setGeneralLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Errore nel caricamento classifica generale:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompletedEvents = async () => {
    try {
      const response = await fetch('/api/events?status=COMPLETED')
      if (response.ok) {
        const data = await response.json()
        setCompletedEvents(data.events || [])
      }
    } catch (error) {
      console.error('Errore nel caricamento eventi completati:', error)
    }
  }

  const loadEventLeaderboard = async (eventId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/leaderboard?eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEventLeaderboard(data.leaderboard)
        setSelectedEvent(data.event)
      }
    } catch (error) {
      console.error('Errore nel caricamento classifica evento:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <span className="text-2xl">🥇</span>
      case 2:
        return <span className="text-2xl">🥈</span>
      case 3:
        return <span className="text-2xl">🥉</span>
      default:
        return <span className="text-lg font-bold text-gray-600">#{position}</span>
    }
  }

  const getPositionColors = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const isCurrentUser = (userId: string) => userId === currentUserId

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-f1-dark flex items-center gap-3">
          <TrophyIcon className="h-8 w-8 text-yellow-500" />
          Classifiche
        </h1>
        <p className="mt-2 text-gray-600">
          Scopri chi è in testa al campionato FantaF1
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap touch-button ${
                activeTab === 'general'
                  ? 'border-f1-red text-f1-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Classifica Generale</span>
              <span className="sm:hidden">Generale</span>
            </button>
            <button
              onClick={() => setActiveTab('event')}
              className={`py-4 px-2 sm:px-1 ml-6 sm:ml-8 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap touch-button ${
                activeTab === 'event'
                  ? 'border-f1-red text-f1-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Classifica per Evento</span>
              <span className="sm:hidden">Per Evento</span>
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Classifica Generale */}
          {activeTab === 'general' && (
            <div>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1-red"></div>
                </div>
              ) : generalLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun dato disponibile</h3>
                  <p className="text-gray-500">
                    I punteggi appariranno dopo i primi eventi completati
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generalLeaderboard.map((entry) => (
                    <div
                      key={entry.user.id}
                      className={`p-4 rounded-lg border-2 transition-all ${getPositionColors(entry.position)} ${
                        isCurrentUser(entry.user.id) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {getPositionIcon(entry.position)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              {entry.user.name || entry.user.email?.split('@')[0] || 'Utente Anonimo'}
                              {isCurrentUser(entry.user.id) && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Tu</span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {entry.eventCount} eventi • Media: {entry.averagePoints.toFixed(1)} punti
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-f1-dark">
                            {entry.totalPoints}
                          </div>
                          <div className="text-sm text-gray-500">punti</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Classifica per Evento */}
          {activeTab === 'event' && (
            <div>
              {!selectedEvent ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Seleziona un evento per vedere la classifica:
                  </h3>
                  {completedEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun evento completato</h3>
                      <p className="text-gray-500">
                        Le classifiche per evento appariranno dopo il completamento delle gare
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {completedEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => loadEventLeaderboard(event.id)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-f1-red hover:bg-red-50 transition-colors text-left"
                        >
                          <h4 className="font-semibold text-f1-dark">{event.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'} • {new Date(event.date).toLocaleDateString('it-IT')}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{selectedEvent.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedEvent.type === 'RACE' ? 'Gran Premio' : 'Sprint'} • {new Date(selectedEvent.date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEvent(null)
                        setEventLeaderboard([])
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Torna agli eventi
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1-red"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {eventLeaderboard
                        .sort((a, b) => (b.points || 0) - (a.points || 0))
                        .map((entry, index) => (
                          <div
                            key={entry.user.id}
                            className={`p-4 rounded-lg border-2 ${getPositionColors(index + 1)} ${
                              isCurrentUser(entry.user.id) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                  {getPositionIcon(index + 1)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {entry.user.name || entry.user.email?.split('@')[0] || 'Utente Anonimo'}
                                    {isCurrentUser(entry.user.id) && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Tu</span>
                                    )}
                                  </h4>
                                  {entry.prediction && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      1° {entry.prediction.firstPlace.name} • 
                                      2° {entry.prediction.secondPlace.name} • 
                                      3° {entry.prediction.thirdPlace.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-f1-dark">
                                  {entry.points || 0}
                                </div>
                                <div className="text-sm text-gray-500">punti</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
