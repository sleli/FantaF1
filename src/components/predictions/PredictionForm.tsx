import { useState, useEffect, useCallback } from 'react'
import { Driver, Event, ScoringType } from '@prisma/client'
import SortableDriverList from './SortableDriverList'

interface ExtendedEvent extends Event {
    season?: {
        scoringType: ScoringType
        driverCount: number
    }
}

interface PredictionFormProps {
  event: ExtendedEvent
  drivers: Driver[]
  onSubmit: (prediction: any) => void
  initialPrediction?: {
    firstPlaceId?: string
    secondPlaceId?: string
    thirdPlaceId?: string
    rankings?: string[]
  }
  lastPrediction?: {
    rankings?: string[]
  }
  isLoading: boolean
  isModifying?: boolean
}

export default function PredictionForm({
  event,
  drivers,
  onSubmit,
  initialPrediction,
  lastPrediction,
  isLoading,
  isModifying = false
}: PredictionFormProps) {
  const scoringType = event.season?.scoringType || ScoringType.LEGACY_TOP3
  const driverCount = event.season?.driverCount || 20

  // View Mode State determined by Season Settings
  const viewMode = scoringType === ScoringType.FULL_GRID_DIFF ? 'GRID' : 'TOP3'

  // Legacy State
  const [firstPlaceId, setFirstPlaceId] = useState(initialPrediction?.firstPlaceId || '')
  const [secondPlaceId, setSecondPlaceId] = useState(initialPrediction?.secondPlaceId || '')
  const [thirdPlaceId, setThirdPlaceId] = useState(initialPrediction?.thirdPlaceId || '')
  
  // New State
  const [orderedDriverIds, setOrderedDriverIds] = useState<string[]>([])
  
  const [errors, setErrors] = useState<string[]>([])

  // Helper to get initial order based on history or random
  const getInitialOrder = useCallback(() => {
    const activeDrivers = drivers
        .filter(d => d.active)
        // Default sort by number if we need a fallback, but we will shuffle or use history
        .sort((a, b) => a.number - b.number)
    
    const activeDriverIds = activeDrivers.map(d => d.id)

    if (initialPrediction?.rankings && Array.isArray(initialPrediction.rankings) && initialPrediction.rankings.length > 0) {
        // EDIT MODE: Use saved rankings
        const savedRankings = initialPrediction.rankings as string[]
        const validSavedRankings = savedRankings.filter(id => activeDriverIds.includes(id))
        const missingDriverIds = activeDriverIds.filter(id => !validSavedRankings.includes(id))
        return [...validSavedRankings, ...missingDriverIds]
    } 
    
    if (lastPrediction?.rankings && Array.isArray(lastPrediction.rankings) && lastPrediction.rankings.length > 0) {
         // NEW PREDICTION (HISTORY): Use last prediction rankings
         const savedRankings = lastPrediction.rankings as string[]
         const validSavedRankings = savedRankings.filter(id => activeDriverIds.includes(id))
         const missingDriverIds = activeDriverIds.filter(id => !validSavedRankings.includes(id))
         // Append missing drivers at the end
         return [...validSavedRankings, ...missingDriverIds]
    }

    // NEW PREDICTION (NO HISTORY): Randomize
    const shuffled = [...activeDriverIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled
  }, [drivers, initialPrediction, lastPrediction])

  // Initialize Ordered IDs
  useEffect(() => {
    // If we have no ordered IDs, initialize them
    if (orderedDriverIds.length === 0) {
        let initialOrder = getInitialOrder()
        
        // If we are in Legacy mode and have explicit selections, ensure they are at the top
        // This handles the case where we load a Legacy prediction but want to view it in Grid mode
        if (scoringType === ScoringType.LEGACY_TOP3 && (initialPrediction?.firstPlaceId || initialPrediction?.secondPlaceId || initialPrediction?.thirdPlaceId)) {
            const top3 = [
                initialPrediction.firstPlaceId, 
                initialPrediction.secondPlaceId, 
                initialPrediction.thirdPlaceId
            ].filter(Boolean) as string[]
            
            const top3Set = new Set(top3)
            const rest = initialOrder.filter(id => !top3Set.has(id))
            initialOrder = [...top3, ...rest]
        }
        
        setOrderedDriverIds(initialOrder)
    }
  }, [getInitialOrder, scoringType, initialPrediction]) // Run once on mount/data load

  // Verifica se l'evento è ancora aperto
  const isEventOpen = event.status === 'UPCOMING' && new Date() < new Date(event.closingDate)
  
  // Filtra i piloti disponibili per ogni posizione (Legacy)
  const getAvailableDrivers = (position: 'first' | 'second' | 'third') => {
    const selectedDrivers = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(Boolean)
    
    return drivers.filter(driver => {
      if (position === 'first' && driver.id === firstPlaceId) return true
      if (position === 'second' && driver.id === secondPlaceId) return true
      if (position === 'third' && driver.id === thirdPlaceId) return true
      
      return !selectedDrivers.includes(driver.id)
    })
  }

  const validateSelection = (data?: any) => {
    const newErrors: string[] = []
    
    // Use derived data if provided, otherwise fallback to state
    const currentFirst = data?.firstPlaceId ?? firstPlaceId
    const currentSecond = data?.secondPlaceId ?? secondPlaceId
    const currentThird = data?.thirdPlaceId ?? thirdPlaceId
    
    if (scoringType === ScoringType.FULL_GRID_DIFF) {
        // Relaxed validation: Allow partial ordering
        // if (orderedDriverIds.length !== driverCount) {
        //    newErrors.push(`Devi ordinare tutti i ${driverCount} piloti`)
        // }
    } else {
        if (!currentFirst) newErrors.push('Seleziona il pilota per il 1° posto')
        if (!currentSecond) newErrors.push('Seleziona il pilota per il 2° posto')
        if (!currentThird) newErrors.push('Seleziona il pilota per il 3° posto')
        
        const selectedDrivers = [currentFirst, currentSecond, currentThird].filter(Boolean)
        const uniqueDrivers = new Set(selectedDrivers)
        
        if (selectedDrivers.length === 3 && uniqueDrivers.size !== 3) {
        newErrors.push('Devi selezionare 3 piloti diversi')
        }
    }

    if (!isEventOpen) {
      newErrors.push('L\'evento non è più aperto per i pronostici')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let dataToSubmit: any = {}

    if (scoringType === ScoringType.FULL_GRID_DIFF) {
        let rankings = orderedDriverIds
        if (viewMode === 'TOP3') {
            // Reconstruct full list from Top 3 inputs + rest of ordered list
            const top3 = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(Boolean)
            const top3Set = new Set(top3)
            // Use existing order for the rest
            const rest = orderedDriverIds.filter(id => !top3Set.has(id))
            rankings = [...top3, ...rest]
        }
        dataToSubmit = { rankings }
    } else {
        // LEGACY_TOP3
        if (viewMode === 'GRID') {
            dataToSubmit = {
                firstPlaceId: orderedDriverIds[0] || '',
                secondPlaceId: orderedDriverIds[1] || '',
                thirdPlaceId: orderedDriverIds[2] || ''
            }
        } else {
            dataToSubmit = {
                firstPlaceId,
                secondPlaceId,
                thirdPlaceId
            }
        }
    }

    if (validateSelection(dataToSubmit)) {
      onSubmit(dataToSubmit)
    }
  }

  const resetForm = () => {
    if (scoringType === ScoringType.FULL_GRID_DIFF) {
        setOrderedDriverIds(getInitialOrder())
    } else {
        setFirstPlaceId('')
        setSecondPlaceId('')
        setThirdPlaceId('')
    }
    setErrors([])
  }

  // Countdown timer logic (same as before)
  const [timeLeft, setTimeLeft] = useState<string>('')
  useEffect(() => {
    if (!isEventOpen) return
    const updateTimer = () => {
      const now = new Date().getTime()
      const closingTime = new Date(event.closingDate).getTime()
      const difference = closingTime - now
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        if (days > 0) setTimeLeft(`${days}g ${hours}h ${minutes}m`)
        else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        else setTimeLeft(`${minutes}m ${seconds}s`)
      } else setTimeLeft('Chiuso')
    }
    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [event.closingDate, isEventOpen])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-f1-dark mb-2">
          {isModifying ? 'Modifica Pronostico' : 'Nuovo Pronostico'}
        </h2>
        <div className="text-gray-600">
          <p className="font-semibold">{event.name}</p>
          <p className="text-sm">
            {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'} - {new Date(event.date).toISOString().slice(0, 16).replace('T', ' ')}
          </p>
          <p className="text-sm mt-1">
             Regole: {scoringType === ScoringType.FULL_GRID_DIFF ? 'Differenza (Low Score)' : 'Standard (Top 3)'}
          </p>
          {isEventOpen ? (
            <p className="text-sm text-green-600 font-medium">
              Chiusura pronostici: {timeLeft}
            </p>
          ) : (
            <p className="text-sm text-red-600 font-medium">
              Pronostici chiusi
            </p>
          )}
        </div>
      </div>

      {!isEventOpen && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800 font-medium">
            I pronostici per questo evento sono stati chiusi.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        
        {viewMode === 'GRID' ? (
            <div className="mb-6">
                <p className="mb-2 text-sm text-gray-600">Trascina i piloti per ordinare la griglia di arrivo prevista:</p>
                <SortableDriverList 
                    drivers={drivers}
                    orderedDriverIds={orderedDriverIds}
                    onChange={setOrderedDriverIds}
                    disabled={!isEventOpen || isLoading}
                />
            </div>
        ) : (
            <>
                {/* Legacy Inputs */}
                {/* 1° Posto */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
                    🥇 1° Posto (25 punti)
                  </label>
                  <select
                    value={firstPlaceId}
                    onChange={(e) => setFirstPlaceId(e.target.value)}
                    className="w-full p-4 sm:p-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-f1-red focus:border-f1-red touch-button"
                    disabled={!isEventOpen || isLoading}
                  >
                    <option value="">Seleziona un pilota...</option>
                    {getAvailableDrivers('first').map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        #{driver.number} {driver.name} ({driver.team})
                      </option>
                    ))}
                  </select>
                </div>
                
                 <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
                    🥈 2° Posto (15 punti)
                  </label>
                  <select
                    value={secondPlaceId}
                    onChange={(e) => setSecondPlaceId(e.target.value)}
                    className="w-full p-4 sm:p-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-f1-red focus:border-f1-red touch-button"
                    disabled={!isEventOpen || isLoading}
                  >
                    <option value="">Seleziona un pilota...</option>
                    {getAvailableDrivers('second').map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        #{driver.number} {driver.name} ({driver.team})
                      </option>
                    ))}
                  </select>
                </div>
                 <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
                    🥉 3° Posto (10 punti)
                  </label>
                  <select
                    value={thirdPlaceId}
                    onChange={(e) => setThirdPlaceId(e.target.value)}
                    className="w-full p-4 sm:p-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-f1-red focus:border-f1-red touch-button"
                    disabled={!isEventOpen || isLoading}
                  >
                    <option value="">Seleziona un pilota...</option>
                    {getAvailableDrivers('third').map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        #{driver.number} {driver.name} ({driver.team})
                      </option>
                    ))}
                  </select>
                </div>
            </>
        )}

        {/* Errori */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
             <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Errori di validazione:
                </h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Note sui punteggi */}
        {event.type === 'SPRINT' && scoringType === ScoringType.LEGACY_TOP3 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 text-sm">
              <strong>Sprint:</strong> I punteggi saranno dimezzati (12.5 - 7.5 - 5 punti)
            </p>
          </div>
        )}

        {/* Bottoni */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={!isEventOpen || isLoading}
            className="prediction-submit-button flex-1 py-4 sm:py-3 px-6 rounded-lg font-medium text-base sm:text-sm"
            style={{
              backgroundColor: (!isEventOpen || isLoading) ? '#9CA3AF' : '#E10600',
              color: 'white',
              border: 'none',
              cursor: (!isEventOpen || isLoading) ? 'not-allowed' : 'pointer',
              display: 'block',
              visibility: 'visible',
              opacity: 1
            }}
          >
            {isLoading ? 'Salvando...' : (isModifying ? 'Aggiorna Pronostico' : 'Salva Pronostico')}
          </button>

          {(firstPlaceId || secondPlaceId || thirdPlaceId || orderedDriverIds.length > 0) && (
            <button
              type="button"
              onClick={resetForm}
              disabled={isLoading}
              className={`px-6 py-4 sm:py-3 border rounded-lg transition-colors text-base sm:text-sm touch-button ${
                isLoading
                  ? 'border-gray-200 bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: isLoading ? '#E5E7EB' : 'white',
                borderColor: isLoading ? '#E5E7EB' : '#D1D5DB',
                color: isLoading ? '#6B7280' : '#374151'
              }}
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
