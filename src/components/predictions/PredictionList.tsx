import { useState, useEffect } from 'react'
import { PredictionWithDetails } from '@/lib/types'

interface PredictionListProps {
  predictions: PredictionWithDetails[]
  onEdit?: (prediction: PredictionWithDetails) => void
  onDelete?: (predictionId: string) => void
  isLoading?: boolean
}

export default function PredictionList({
  predictions,
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completato
        </span>
      )
    } else if (prediction.event.status === 'CLOSED' || now > closingDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Chiuso
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Aperto
        </span>
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
          <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun pronostico</h3>
        <p className="text-gray-500">Non hai ancora fatto nessun pronostico.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {predictions.map((prediction) => (
        <div key={prediction.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-f1-dark truncate">
                {prediction.event.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">
                  {prediction.event.type === 'RACE' ? 'Gran Premio' : 'Sprint'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {formatDate(prediction.event.date)}
                </span>
                {getStatusBadge(prediction)}
              </div>
            </div>

            {/* Azioni */}
            <div className="flex gap-2 flex-shrink-0">
              {canModifyPrediction(prediction) && onEdit && (
                <button
                  onClick={() => onEdit(prediction)}
                  disabled={isLoading}
                  className="p-3 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 touch-target"
                  title="Modifica pronostico"
                >
                  <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              {canModifyPrediction(prediction) && onDelete && (
                <button
                  onClick={() => onDelete(prediction.id)}
                  disabled={isLoading}
                  className="p-3 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 touch-target"
                  title="Elimina pronostico"
                >
                  <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Pronostico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* 1° Posto */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">🥇 1° Posto</span>
                <span className="text-xs text-yellow-600">
                  {prediction.event.type === 'SPRINT' ? '12.5 pt' : '25 pt'}
                </span>
              </div>
              <div className="text-f1-dark">
                <p className="font-semibold">#{prediction.firstPlace.number} {prediction.firstPlace.name}</p>
                <p className="text-sm text-gray-600">{prediction.firstPlace.team}</p>
              </div>
            </div>

            {/* 2° Posto */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">🥈 2° Posto</span>
                <span className="text-xs text-gray-600">
                  {prediction.event.type === 'SPRINT' ? '7.5 pt' : '15 pt'}
                </span>
              </div>
              <div className="text-f1-dark">
                <p className="font-semibold">#{prediction.secondPlace.number} {prediction.secondPlace.name}</p>
                <p className="text-sm text-gray-600">{prediction.secondPlace.team}</p>
              </div>
            </div>

            {/* 3° Posto */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-800">🥉 3° Posto</span>
                <span className="text-xs text-orange-600">
                  {prediction.event.type === 'SPRINT' ? '5 pt' : '10 pt'}
                </span>
              </div>
              <div className="text-f1-dark">
                <p className="font-semibold">#{prediction.thirdPlace.number} {prediction.thirdPlace.name}</p>
                <p className="text-sm text-gray-600">{prediction.thirdPlace.team}</p>
              </div>
            </div>
          </div>

          {/* Punteggio e meta info */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
            <div>
              {prediction.points !== null ? (
                <span className="font-medium text-green-600">
                  Punteggio: {prediction.points} punti
                </span>
              ) : (
                <span>In attesa dei risultati</span>
              )}
            </div>
            <div className="flex gap-4">
              <span>Creato: {new Date(prediction.createdAt).toISOString().slice(0, 16).replace('T', ' ')}</span>
              {prediction.updatedAt !== prediction.createdAt && (
                <span>Modificato: {new Date(prediction.updatedAt).toISOString().slice(0, 16).replace('T', ' ')}</span>
              )}
            </div>
          </div>

          {/* Countdown per eventi aperti */}
          {canModifyPrediction(prediction) && (
            <div className="mt-2 text-sm text-blue-600">
              <CountdownTimer closingDate={prediction.event.closingDate} />
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
