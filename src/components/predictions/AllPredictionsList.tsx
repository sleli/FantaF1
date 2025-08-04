import { useState } from 'react'
import { PredictionWithDetails } from '@/lib/types'

interface AllPredictionsListProps {
  predictions: PredictionWithDetails[]
  isLoading?: boolean
  selectedEventId: string
}

export default function AllPredictionsList({
  predictions,
  isLoading = false,
  selectedEventId
}: AllPredictionsListProps) {
  const [expandedPrediction, setExpandedPrediction] = useState<string | null>(null)

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (prediction: PredictionWithDetails) => {
    const now = new Date()
    const closingDate = prediction.event.closingDate instanceof Date 
      ? prediction.event.closingDate 
      : new Date(prediction.event.closingDate)

    if (prediction.event.status === 'COMPLETED') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Completato
        </span>
      )
    }

    if (now > closingDate || prediction.event.status === 'CLOSED') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Chiuso
        </span>
      )
    }

    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
        Aperto
      </span>
    )
  }

  // Raggruppa i pronostici per evento se stiamo mostrando tutti gli eventi
  const groupedPredictions = selectedEventId === 'all' 
    ? predictions.reduce((groups, prediction) => {
        const eventId = prediction.event.id
        if (!groups[eventId]) {
          groups[eventId] = {
            event: prediction.event,
            predictions: []
          }
        }
        groups[eventId].predictions.push(prediction)
        return groups
      }, {} as Record<string, { event: any, predictions: PredictionWithDetails[] }>)
    : null

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-12 p-6">
        <div className="w-24 h-24 mx-auto mb-4">
          <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun pronostico</h3>
        <p className="text-gray-500">
          {selectedEventId === 'all' 
            ? 'Non ci sono ancora pronostici da visualizzare.'
            : 'Non ci sono pronostici per questo evento.'
          }
        </p>
      </div>
    )
  }

  if (selectedEventId === 'all' && groupedPredictions) {
    // Vista raggruppata per evento
    return (
      <div className="divide-y divide-gray-200">
        {Object.values(groupedPredictions).map(({ event, predictions: eventPredictions }) => (
          <div key={event.id} className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {event.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'}
                  </span>
                  {getStatusBadge(eventPredictions[0])}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(event.date)} • {eventPredictions.length} pronostic{eventPredictions.length === 1 ? 'o' : 'i'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventPredictions.map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Vista lista semplice per evento singolo
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map((prediction) => (
          <PredictionCard key={prediction.id} prediction={prediction} showEventInfo />
        ))}
      </div>
    </div>
  )
}

// Componente per singola carta pronostico
function PredictionCard({ 
  prediction, 
  showEventInfo = false 
}: { 
  prediction: PredictionWithDetails
  showEventInfo?: boolean 
}) {
  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* Header con info utente */}
      <div className="flex items-center gap-3 mb-4">
        {prediction.user.image && (
          <img 
            src={prediction.user.image} 
            alt={prediction.user.name || 'User'} 
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {prediction.user.name || 'Utente Anonimo'}
          </p>
          {showEventInfo && (
            <p className="text-xs text-gray-600 truncate">
              {prediction.event.name}
            </p>
          )}
        </div>
        {prediction.points !== null && (
          <span className="text-sm font-semibold text-green-600">
            {prediction.points} pt
          </span>
        )}
      </div>

      {/* Pronostico */}
      <div className="space-y-2">
        {prediction.isHidden ? (
          // Mostra placeholder per pronostici nascosti
          <div className="text-center py-4">
            <div className="text-gray-500 text-sm">
              🔒 Pronostico nascosto
            </div>
            <div className="text-xs text-gray-400 mt-1">
              I dettagli saranno visibili al termine dell'evento
            </div>
          </div>
        ) : (
          // Mostra i dettagli del pronostico
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-yellow-600">🥇</span>
              <span className="text-sm text-gray-900">
                #{prediction.firstPlace?.number} {prediction.firstPlace?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">🥈</span>
              <span className="text-sm text-gray-900">
                #{prediction.secondPlace?.number} {prediction.secondPlace?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-orange-600">🥉</span>
              <span className="text-sm text-gray-900">
                #{prediction.thirdPlace?.number} {prediction.thirdPlace?.name}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Footer con data */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {formatDate(prediction.createdAt)}
        </p>
      </div>
    </div>
  )
}
