import { useState } from 'react'
import { PredictionWithDetails } from '@/lib/types'
import { Driver, ScoringType } from '@prisma/client'
import PredictionDisplay from './PredictionDisplay'
import Badge from '@/components/ui/Badge'

interface AllPredictionsListProps {
  predictions: PredictionWithDetails[]
  drivers?: Driver[]
  isLoading?: boolean
  selectedEventId: string
}

export default function AllPredictionsList({
  predictions,
  drivers = [],
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
        <Badge variant="success">Completato</Badge>
      )
    }

    if (now > closingDate || prediction.event.status === 'CLOSED') {
      return (
        <Badge variant="warning">Chiuso</Badge>
      )
    }

    return (
      <Badge variant="info">Aperto</Badge>
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
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-12 p-6">
        <div className="w-24 h-24 mx-auto mb-4">
          <svg className="w-full h-full text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Nessun pronostico</h3>
        <p className="text-muted-foreground">
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
      <div className="divide-y divide-border">
        {Object.values(groupedPredictions).map(({ event, predictions: eventPredictions }) => (
          <div key={event.id} className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {event.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'}
                  </span>
                  {getStatusBadge(eventPredictions[0])}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(event.date)} • {eventPredictions.length} pronostic{eventPredictions.length === 1 ? 'o' : 'i'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventPredictions.map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} drivers={drivers} />
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
  drivers = [],
  showEventInfo = false 
}: { 
  prediction: PredictionWithDetails
  drivers?: Driver[]
  showEventInfo?: boolean 
}) {
  const scoringType = (prediction.event as any).season?.scoringType || ScoringType.LEGACY_TOP3

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 border border-border hover:border-primary/40 hover:shadow-md transition-shadow duration-200">
      {/* Header con info utente */}
      <div className="flex items-center gap-3 mb-4">
        {prediction.user.image ? (
          <img 
            src={prediction.user.image} 
            alt={prediction.user.name || 'User'} 
            className="w-10 h-10 rounded-full border-2 border-border shadow-sm"
            loading="lazy"
          />
        ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-border shadow-sm">
                <span className="text-muted-foreground font-bold text-sm">
                    {(prediction.user.name || 'U').charAt(0).toUpperCase()}
                </span>
            </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {prediction.user.name || 'Utente Anonimo'}
          </p>
          {showEventInfo && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {prediction.event.name}
            </p>
          )}
        </div>
        {prediction.points !== null && (
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-green-500 leading-none">
                {prediction.points}
            </span>
            <span className="text-[10px] text-green-500 uppercase font-medium">punti</span>
          </div>
        )}
      </div>

      {/* Pronostico */}
      <div className="space-y-2 min-h-[120px]">
        {prediction.isHidden ? (
          // Mostra placeholder per pronostici nascosti
          <div className="flex flex-col items-center justify-center h-full py-6 bg-muted/40 rounded-lg border border-dashed border-border">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-muted-foreground text-sm font-medium">
              Pronostico nascosto
            </div>
            <div className="text-xs text-muted-foreground mt-1 px-4 text-center">
              Visibile al termine dell'evento
            </div>
          </div>
        ) : (
          <PredictionDisplay prediction={prediction} drivers={drivers} />
        )}
      </div>

      {/* Footer con data */}
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Inviato il {formatDate(prediction.createdAt)}
        </p>
      </div>
    </div>
  )
}
