import { EventType, ScoringType } from '@prisma/client'
import { POINTS } from './types'

export type PredictionResult = {
  firstPlaceId?: string | null
  secondPlaceId?: string | null
  thirdPlaceId?: string | null
  rankings?: any
}

export type EventResult = {
  firstPlaceId?: string | null
  secondPlaceId?: string | null
  thirdPlaceId?: string | null
  results?: any
}

/**
 * Calcola il punteggio basato sulla differenza assoluta (nuovo sistema)
 * Punteggio più basso = migliore
 */
export function calculateAbsoluteDifferenceScore(
  predictionRankings: string[],
  resultRankings: string[]
): number {
  let score = 0
  
  // Se mancano dati, penalità massima? Per ora 0 o gestito a monte
  if (!predictionRankings || !resultRankings) return 1000 // Penalità alta

  resultRankings.forEach((driverId, actualIndex) => {
    const predictedIndex = predictionRankings.indexOf(driverId)
    if (predictedIndex !== -1) {
      score += Math.abs(predictedIndex - actualIndex)
    } else {
      // Pilota non pronosticato (non dovrebbe succedere con griglia completa)
      // Penalità: posizione max (20)
      score += 20 
    }
  })

  return score
}

/**
 * Wrapper principale per il calcolo punteggi
 */
export function calculateScore(
  prediction: PredictionResult,
  result: EventResult,
  eventType: EventType,
  scoringType: ScoringType = ScoringType.LEGACY_TOP3
): number {
  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    const predRankings = (prediction.rankings as string[]) || []
    const resRankings = (result.results as string[]) || []
    
    // Fallback per migrazione: se non ci sono ranking JSON, usa i vecchi campi se possibile
    // Ma per il nuovo sistema FULL_GRID_DIFF ci aspettiamo il JSON.
    
    return calculateAbsoluteDifferenceScore(predRankings, resRankings)
  }

  // Legacy Logic
  // Ensure we have strings
  const legacyPrediction = {
    firstPlaceId: prediction.firstPlaceId || '',
    secondPlaceId: prediction.secondPlaceId || '',
    thirdPlaceId: prediction.thirdPlaceId || ''
  }
  const legacyResult = {
    firstPlaceId: result.firstPlaceId || '',
    secondPlaceId: result.secondPlaceId || '',
    thirdPlaceId: result.thirdPlaceId || ''
  }

  return calculatePoints(legacyPrediction, legacyResult, eventType)
}

/**
 * Calcola i punti per un pronostico confrontandolo con il risultato effettivo (LEGACY)
 */
export function calculatePoints(
  prediction: { firstPlaceId: string, secondPlaceId: string, thirdPlaceId: string },
  result: { firstPlaceId: string, secondPlaceId: string, thirdPlaceId: string },
  eventType: EventType
): number {
  const pointsConfig = eventType === 'RACE' ? POINTS.RACE : POINTS.SPRINT
  let totalPoints = 0

  // Array dei pronostici e risultati per facilitare i controlli
  const predictionArray = [prediction.firstPlaceId, prediction.secondPlaceId, prediction.thirdPlaceId]
  const resultArray = [result.firstPlaceId, result.secondPlaceId, result.thirdPlaceId]

  // Controllo posizioni esatte
  if (prediction.firstPlaceId === result.firstPlaceId) {
    totalPoints += pointsConfig.FIRST_CORRECT
  }
  if (prediction.secondPlaceId === result.secondPlaceId) {
    totalPoints += pointsConfig.SECOND_CORRECT
  }
  if (prediction.thirdPlaceId === result.thirdPlaceId) {
    totalPoints += pointsConfig.THIRD_CORRECT
  }

  // Controllo piloti presenti ma in posizione sbagliata
  predictionArray.forEach((predictedDriverId, predictionIndex) => {
    const resultIndex = resultArray.indexOf(predictedDriverId)
    
    // Se il pilota è presente nel risultato ma in posizione diversa
    if (resultIndex !== -1 && resultIndex !== predictionIndex) {
      totalPoints += pointsConfig.PRESENT_WRONG_POSITION
    }
  })

  return totalPoints
}

/**
 * Valida che un pronostico non abbia piloti duplicati
 */
export function validatePrediction(prediction: PredictionResult): boolean {
  const drivers = [prediction.firstPlaceId, prediction.secondPlaceId, prediction.thirdPlaceId]
  const uniqueDrivers = new Set(drivers)
  return uniqueDrivers.size === 3
}

/**
 * Calcola la classifica generale basata sui punti totali
 */
export function calculateLeaderboard(
  predictions: Array<{
    user: { id: string; name: string | null; email: string | null }
    points: number | null
  }>,
  scoringType: ScoringType = ScoringType.LEGACY_TOP3
): Array<{
  user: { id: string; name: string | null; email: string | null }
  totalPoints: number
  eventCount: number
  averagePoints: number
}> {
  const userStats = new Map<string, {
    user: { id: string; name: string | null; email: string | null }
    totalPoints: number
    eventCount: number
  }>()

  // Aggrega i punti per utente
  predictions.forEach(prediction => {
    if (prediction.points !== null) {
      const userId = prediction.user.id
      const existing = userStats.get(userId)
      
      if (existing) {
        existing.totalPoints += prediction.points
        existing.eventCount += 1
      } else {
        userStats.set(userId, {
          user: prediction.user,
          totalPoints: prediction.points,
          eventCount: 1
        })
      }
    }
  })

  // Converte in array e calcola la media
  const leaderboard = Array.from(userStats.values()).map(stats => ({
    user: stats.user,
    totalPoints: stats.totalPoints,
    eventCount: stats.eventCount,
    averagePoints: stats.eventCount > 0 ? stats.totalPoints / stats.eventCount : 0
  }))

  // Ordina in base al sistema di punteggio
  return leaderboard.sort((a, b) => {
    if (scoringType === ScoringType.FULL_GRID_DIFF) {
      // Punteggio più basso vince (Crescente)
      return a.totalPoints - b.totalPoints
    } else {
      // Punteggio più alto vince (Decrescente - Legacy)
      return b.totalPoints - a.totalPoints
    }
  })
}

/**
 * Verifica se è ancora possibile inviare/modificare pronostici per un evento
 */
export function canMakePrediction(event: { closingDate: Date; status: string }): boolean {
  const now = new Date()
  return event.status === 'UPCOMING' && now < event.closingDate
}

/**
 * Formatta una data per la visualizzazione (mostra UTC raw)
 */
export function formatEventDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  // Mostra la data UTC esattamente come salvata nel DB
  return dateObj.toISOString().slice(0, 16).replace('T', ' ')
}

/**
 * Calcola il tempo rimanente per chiusura pronostici
 */
export function getTimeUntilClosing(closingDate: Date): string {
  const now = new Date()
  const diff = closingDate.getTime() - now.getTime()

  if (diff <= 0) return 'Chiuso'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}g ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
