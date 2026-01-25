import { useState, useEffect, useCallback, useMemo } from 'react'
import { Driver, Event, ScoringType } from '@prisma/client'
import SortableDriverList from './SortableDriverList'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

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
  const [touched, setTouched] = useState(false)

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

  const activeDrivers = useMemo(() => drivers.filter(d => d.active), [drivers])
  const activeDriverIds = useMemo(() => activeDrivers.map(d => d.id), [activeDrivers])
  const requiredDriverCount = useMemo(() => {
    if (scoringType === ScoringType.FULL_GRID_DIFF) return activeDrivers.length
    return 3
  }, [scoringType, activeDrivers.length])

  const validationErrors = useMemo(() => {
    const newErrors: string[] = []

    if (scoringType === ScoringType.FULL_GRID_DIFF) {
      const unique = new Set(orderedDriverIds)
      if (unique.size !== orderedDriverIds.length) {
        newErrors.push('Sono presenti piloti duplicati nella griglia')
      }

      if (orderedDriverIds.length !== requiredDriverCount) {
        newErrors.push(`Devi ordinare tutti i ${requiredDriverCount} piloti`)
      }

      const unknownIds = orderedDriverIds.filter(id => !activeDriverIds.includes(id))
      if (unknownIds.length > 0) {
        newErrors.push('La griglia contiene piloti non validi')
      }
    } else {
      if (!firstPlaceId) newErrors.push('Seleziona il pilota per il 1° posto')
      if (!secondPlaceId) newErrors.push('Seleziona il pilota per il 2° posto')
      if (!thirdPlaceId) newErrors.push('Seleziona il pilota per il 3° posto')

      const selectedDrivers = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(Boolean)
      const uniqueDrivers = new Set(selectedDrivers)
      if (selectedDrivers.length === 3 && uniqueDrivers.size !== 3) {
        newErrors.push('Devi selezionare 3 piloti diversi')
      }
    }

    if (!isEventOpen) {
      newErrors.push("L'evento non è più aperto per i pronostici")
    }

    return newErrors
  }, [
    scoringType,
    orderedDriverIds,
    requiredDriverCount,
    activeDriverIds,
    firstPlaceId,
    secondPlaceId,
    thirdPlaceId,
    isEventOpen,
  ])

  const isValid = validationErrors.length === 0
  const displayedErrors = touched ? validationErrors : []

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

    if (!isValid) {
      setTouched(true)
      return
    }

    onSubmit(dataToSubmit)
  }

  const resetForm = () => {
    if (scoringType === ScoringType.FULL_GRID_DIFF) {
        setOrderedDriverIds(getInitialOrder())
    } else {
        setFirstPlaceId('')
        setSecondPlaceId('')
        setThirdPlaceId('')
    }
    setTouched(false)
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
    <Card>
      <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isModifying ? 'Modifica Pronostico' : 'Nuovo Pronostico'}
        </h2>
        <div className="text-muted-foreground">
          <p className="font-semibold">{event.name}</p>
          <p className="text-sm">
            {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'} - {new Date(event.date).toISOString().slice(0, 16).replace('T', ' ')}
          </p>
          <p className="text-sm mt-1">
             Regole: {scoringType === ScoringType.FULL_GRID_DIFF ? 'Differenza (Low Score)' : 'Standard (Top 3)'}
          </p>
          {isEventOpen ? (
            <p className="text-sm text-green-500 font-medium">
              Chiusura pronostici: {timeLeft}
            </p>
          ) : (
            <p className="text-sm text-destructive font-medium">
              Pronostici chiusi
            </p>
          )}
        </div>
      </div>

      {!isEventOpen && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4 mb-6">
          <p className="text-destructive font-medium">
            I pronostici per questo evento sono stati chiusi.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        
        {viewMode === 'GRID' ? (
            <div className="mb-6">
                <p className="mb-2 text-sm text-muted-foreground">Trascina i piloti per ordinare la griglia di arrivo prevista:</p>
                <SortableDriverList 
                    drivers={drivers}
                    orderedDriverIds={orderedDriverIds}
                    onChange={(newOrder) => {
                      setTouched(true)
                      setOrderedDriverIds(newOrder)
                    }}
                    disabled={!isEventOpen || isLoading}
                />
            </div>
        ) : (
            <>
                {/* Legacy Inputs */}
                {/* 1° Posto */}
                <Select
                  label="🥇 1° Posto (25 punti)"
                  value={firstPlaceId}
                  onChange={(e) => {
                    setTouched(true)
                    setFirstPlaceId(e.target.value)
                  }}
                  disabled={!isEventOpen || isLoading}
                >
                  <option value="">Seleziona un pilota...</option>
                  {getAvailableDrivers('first').map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      #{driver.number} {driver.name} ({driver.team})
                    </option>
                  ))}
                </Select>
                
                <Select
                  label="🥈 2° Posto (15 punti)"
                  value={secondPlaceId}
                  onChange={(e) => {
                    setTouched(true)
                    setSecondPlaceId(e.target.value)
                  }}
                  disabled={!isEventOpen || isLoading}
                >
                  <option value="">Seleziona un pilota...</option>
                  {getAvailableDrivers('second').map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      #{driver.number} {driver.name} ({driver.team})
                    </option>
                  ))}
                </Select>
                <Select
                  label="🥉 3° Posto (10 punti)"
                  value={thirdPlaceId}
                  onChange={(e) => {
                    setTouched(true)
                    setThirdPlaceId(e.target.value)
                  }}
                  disabled={!isEventOpen || isLoading}
                >
                  <option value="">Seleziona un pilota...</option>
                  {getAvailableDrivers('third').map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      #{driver.number} {driver.name} ({driver.team})
                    </option>
                  ))}
                </Select>
            </>
        )}

        {/* Errori */}
        {displayedErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
             <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">
                  Errori di validazione:
                </h3>
                <ul className="mt-2 text-sm text-destructive list-disc list-inside">
                  {displayedErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Note sui punteggi Sprint */}
        {event.type === 'SPRINT' && (
          <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
            <p className="text-primary text-sm">
              <strong>Sprint:</strong> {scoringType === ScoringType.FULL_GRID_DIFF 
                ? 'Le penalità saranno dimezzate (x 0.5)' 
                : 'I punteggi saranno dimezzati (12.5 - 7.5 - 5 punti)'}
            </p>
          </div>
        )}

        {/* Bottoni */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="submit"
            disabled={!isEventOpen || isLoading || !isValid}
            className="prediction-submit-button flex-1"
            isLoading={isLoading}
          >
            {isModifying ? 'Aggiorna Pronostico' : 'Salva Pronostico'}
          </Button>

          {(firstPlaceId || secondPlaceId || thirdPlaceId || orderedDriverIds.length > 0) && (
            <Button
              type="button"
              onClick={resetForm}
              disabled={isLoading}
              variant="outline"
              className="touch-button"
            >
              Reset
            </Button>
          )}
        </div>
      </form>
      </div>
    </Card>
  )
}
