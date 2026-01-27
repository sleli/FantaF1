import { useState, useEffect } from 'react'
import { PredictionWithDetails } from '@/lib/types'
import { Driver, ScoringType } from '@prisma/client'
import PredictionDisplay from './PredictionDisplay'
import Badge from '@/components/ui/Badge'

interface PredictionListProps {
  predictions: PredictionWithDetails[]
  drivers?: Driver[]
  onEdit?: (prediction: PredictionWithDetails) => void
  onDelete?: (predictionId: string) => void
  isLoading?: boolean
}

export default function PredictionList({
  predictions,
  drivers = [],
  onEdit,
  onDelete,
  isLoading = false
}: PredictionListProps) {
  const getStatusBadge = (prediction: PredictionWithDetails) => {
    const now = new Date()
    const closingDate = prediction.event.closingDate instanceof Date 
      ? prediction.event.closingDate 
      : new Date(prediction.event.closingDate)
    
    if (prediction.event.status === 'COMPLETED') {
      return (
        <Badge variant="success">Completato</Badge>
      )
    } else if (prediction.event.status === 'CLOSED' || now > closingDate) {
      return (
        <Badge variant="warning">Chiuso</Badge>
      )
    } else {
      return (
        <Badge variant="info">Aperto</Badge>
      )
    }
  }

  const canModifyPrediction = (prediction: PredictionWithDetails) => {
    const now = new Date()
    const closingDate = prediction.event.closingDate instanceof Date 
      ? prediction.event.closingDate 
      : new Date(prediction.event.closingDate)
    return prediction.event.status === 'UPCOMING' && now < closingDate
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Mostra la data UTC esattamente come salvata nel DB
    return dateObj.toISOString().slice(0, 16).replace('T', ' ');
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4">
          <svg className="w-full h-full text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Nessun pronostico</h3>
        <p className="text-muted-foreground">Non hai ancora fatto nessun pronostico.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {predictions.map((prediction) => (
        <div key={prediction.id} className="bg-card text-card-foreground rounded-xl shadow-md border border-border overflow-hidden">
          {/* Header compatto */}
          <div className="px-5 py-4 bg-surface-2/50 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(prediction)}
                  <span className="text-xs text-muted-foreground">
                    {prediction.event.type === 'RACE' ? 'GP' : 'Sprint'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground truncate">
                  {prediction.event.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(prediction.event.date)}
                </p>
              </div>

              {/* Score badge */}
              {prediction.points !== null ? (
                <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-accent-green/10 flex-shrink-0">
                  <span className="text-2xl font-black text-accent-green leading-none tabular-nums">
                    {prediction.points}
                  </span>
                  <span className="text-[10px] text-accent-green uppercase font-semibold mt-0.5">punti</span>
                </div>
              ) : (
                <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-surface-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground font-medium">In attesa</span>
                </div>
              )}
            </div>

            {/* Countdown per eventi aperti */}
            {canModifyPrediction(prediction) && (
              <div className="mt-3 text-xs text-primary font-medium">
                <CountdownTimer closingDate={prediction.event.closingDate} />
              </div>
            )}
          </div>

          {/* Pronostico - Open design */}
          <div className="p-5">
            <PredictionDisplay prediction={prediction} drivers={drivers} />
          </div>

          {/* Footer con azioni */}
          {canModifyPrediction(prediction) && (onEdit || onDelete) && (
            <div className="px-5 py-3 bg-surface-2/30 border-t border-border flex justify-end gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(prediction)}
                  disabled={isLoading}
                  className="
                    flex items-center gap-2 px-4 py-2
                    text-sm font-medium text-primary
                    bg-primary/10 hover:bg-primary/20
                    rounded-lg transition-colors disabled:opacity-50
                    touch-target
                  "
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Modifica</span>
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(prediction.id)}
                  disabled={isLoading}
                  className="
                    flex items-center gap-2 px-4 py-2
                    text-sm font-medium text-destructive
                    hover:bg-destructive/10
                    rounded-lg transition-colors disabled:opacity-50
                    touch-target
                  "
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Elimina</span>
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CountdownTimer({ closingDate }: { closingDate: string | Date }) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const closingDateObj = typeof closingDate === 'string' ? new Date(closingDate) : closingDate
      const closing = closingDateObj.getTime()
      const difference = closing - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

        if (days > 0) {
          setTimeLeft(`Modificabile per altri ${days}g ${hours}h ${minutes}m`)
        } else if (hours > 0) {
          setTimeLeft(`Modificabile per altre ${hours}h ${minutes}m`)
        } else {
          setTimeLeft(`Modificabile per altri ${minutes}m`)
        }
      } else {
        setTimeLeft('Non più modificabile')
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 60000) // Aggiorna ogni minuto

    return () => clearInterval(timer)
  }, [closingDate])

  return <span>{timeLeft}</span>
}
