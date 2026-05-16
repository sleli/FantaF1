import { EventType, ScoringType } from '@prisma/client'
import { POINTS } from './types'

// --- Constants ---
export const MAX_PENALTY = 20;
export const MISSING_DATA_PENALTY = 1000;

// Pesi posizionali per FULL_GRID_DIFF
export const TOP10_WEIGHT = 0.8;
export const LOW_GRID_WEIGHT = 1.2;
export const TOP10_THRESHOLD = 10; // posizioni 0–9 in 0-indexed (top 10)

// Bonus podio esatto per FULL_GRID_DIFF (valori negativi riducono lo score)
export const PODIUM_BONUS_EXACT_1 = -10;   // solo 1° indovinato
export const PODIUM_BONUS_EXACT_2 = -30;   // 1° e 2° indovinati
export const PODIUM_BONUS_EXACT_3 = -50;   // 1°, 2° e 3° indovinati

// Catch-up multiplier per FULL_GRID_DIFF
export const CATCHUP_GAP_THRESHOLD = 50;  // distacco minimo dal leader per attivare il moltiplicatore
export const CATCHUP_MULTIPLIER = 0.8;     // moltiplicatore applicato allo score (lower is better -> riduce lo score)

/**
 * Calcola il punteggio peggiore possibile per una griglia di N piloti.
 * Formula: floor(N²/2) — equivale a N²/2 se N pari, (N²-1)/2 se N dispari.
 * Rappresenta il punteggio massimo con pronostico invertito (permutazione completa griglia).
 * Esempi: N=20 -> 200, N=21 -> 220, N=22 -> 242
 */
export function calculateWorstPossibleScore(n: number): number {
  return Math.floor(n * n / 2);
}

// --- Types ---
export type PredictionResult = {
  firstPlaceId?: string | null
  secondPlaceId?: string | null
  thirdPlaceId?: string | null
  rankings?: string[] | any 
}

export type EventResult = {
  firstPlaceId?: string | null
  secondPlaceId?: string | null
  thirdPlaceId?: string | null
  results?: string[] | any
}

export type LeaderboardUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export type LeaderboardEntry = {
  user: LeaderboardUser;
  totalPoints: number;
  eventCount: number;
  averagePoints: number;
};

// --- Strategy Pattern Implementation ---

export interface ScoringStrategy {
  calculate(prediction: PredictionResult, result: EventResult, eventType: EventType): number;
}

export class LegacyTop3Strategy implements ScoringStrategy {
  calculate(prediction: PredictionResult, result: EventResult, eventType: EventType): number {
    const pointsConfig = eventType === 'RACE' ? POINTS.RACE : POINTS.SPRINT;
    let totalPoints = 0;

    // Helper to get safe strings
    const p1 = prediction.firstPlaceId || '';
    const p2 = prediction.secondPlaceId || '';
    const p3 = prediction.thirdPlaceId || '';
    
    const r1 = result.firstPlaceId || '';
    const r2 = result.secondPlaceId || '';
    const r3 = result.thirdPlaceId || '';

    const predictionArray = [p1, p2, p3];
    const resultArray = [r1, r2, r3];

    // Check exact matches
    if (p1 === r1) totalPoints += pointsConfig.FIRST_CORRECT;
    if (p2 === r2) totalPoints += pointsConfig.SECOND_CORRECT;
    if (p3 === r3) totalPoints += pointsConfig.THIRD_CORRECT;

    // Check wrong positions
    predictionArray.forEach((predId, idx) => {
      const resIdx = resultArray.indexOf(predId);
      // If driver is in result but not in the predicted position
      if (resIdx !== -1 && resIdx !== idx) {
        totalPoints += pointsConfig.PRESENT_WRONG_POSITION;
      }
    });

    return totalPoints;
  }
}

export class FullGridDiffStrategy implements ScoringStrategy {
  calculate(prediction: PredictionResult, result: EventResult, eventType: EventType): number {
    const predRankings = (prediction.rankings as string[]) || [];
    const resRankings = (result.results as string[]) || [];

    // Delegate core calculation to helper for reusability
    let score = calculateAbsoluteDifferenceScoreHelper(predRankings, resRankings);

    // Applica bonus podio esatto (riduce lo score)
    const podiumBonus = calculatePodiumBonusHelper(predRankings, resRankings, eventType);
    score += podiumBonus;

    // Sprint penalty reduction (since lower score is better, half points = half penalty)
    if (eventType === 'SPRINT') {
      score = score * 0.5;
    }

    // Lo score non può scendere sotto 0
    return Math.max(0, score);
  }
}

export class ScoringCalculator {
  private static strategies: Record<ScoringType, ScoringStrategy> = {
    [ScoringType.LEGACY_TOP3]: new LegacyTop3Strategy(),
    [ScoringType.FULL_GRID_DIFF]: new FullGridDiffStrategy(),
  };

  static getStrategy(type: ScoringType): ScoringStrategy {
    return this.strategies[type] || this.strategies[ScoringType.LEGACY_TOP3];
  }

  static calculate(
    prediction: PredictionResult, 
    result: EventResult, 
    eventType: EventType, 
    scoringType: ScoringType
  ): number {
    return this.getStrategy(scoringType).calculate(prediction, result, eventType);
  }
}

// --- Helper Functions ---

/**
 * Calcola il bonus podio esatto per FULL_GRID_DIFF.
 * Restituisce un valore negativo (bonus) se il podio è indovinato.
 * I bonus non sono cumulativi: si applica solo il tier più alto raggiunto.
 */
function calculatePodiumBonusHelper(
  predRankings: string[],
  resRankings: string[],
  eventType: EventType
): number {
  // Servono almeno 3 elementi in entrambi gli array per verificare il podio
  if (predRankings.length < 3 || resRankings.length < 3) {
    return 0;
  }

  const firstExact = predRankings[0] === resRankings[0];
  const secondExact = predRankings[1] === resRankings[1];
  const thirdExact = predRankings[2] === resRankings[2];

  let bonus = 0;

  if (firstExact && secondExact && thirdExact) {
    bonus = PODIUM_BONUS_EXACT_3;
  } else if (firstExact && secondExact) {
    bonus = PODIUM_BONUS_EXACT_2;
  } else if (firstExact) {
    bonus = PODIUM_BONUS_EXACT_1;
  }

  // Per le Sprint il bonus viene applicato prima del dimezzamento,
  // quindi qui restituiamo il bonus pieno (sarà dimezzato insieme al resto)
  return bonus;
}

function calculateAbsoluteDifferenceScoreHelper(
  predictionRankings: string[],
  resultRankings: string[]
): number {
  if (!resultRankings || resultRankings.length === 0) {
    return MISSING_DATA_PENALTY;
  }
  if (!predictionRankings || predictionRankings.length === 0) {
    return calculateWorstPossibleScore(resultRankings.length);
  }

  let score = 0;
  resultRankings.forEach((driverId, actualIndex) => {
    // Peso posizionale: primi 10 (0-9) peso ridotto, 11+ peso aumentato
    const positionWeight = actualIndex < TOP10_THRESHOLD ? TOP10_WEIGHT : LOW_GRID_WEIGHT;
    const predictedIndex = predictionRankings.indexOf(driverId);
    if (predictedIndex !== -1) {
      score += Math.abs(predictedIndex - actualIndex) * positionWeight;
    } else {
      // Driver not predicted -> Max penalty (pesata per posizione)
      score += MAX_PENALTY * positionWeight;
    }
  });

  return score;
}

// --- Exported Functions (Public API) ---

/**
 * Main wrapper for score calculation.
 * Uses Strategy Pattern internally.
 */
export function calculateScore(
  prediction: PredictionResult,
  result: EventResult,
  eventType: EventType,
  scoringType: ScoringType = ScoringType.LEGACY_TOP3
): number {
  return ScoringCalculator.calculate(prediction, result, eventType, scoringType);
}

/**
 * Calculates absolute difference score.
 * Kept for backward compatibility and direct usage.
 */
export function calculateAbsoluteDifferenceScore(
  predictionRankings: string[],
  resultRankings: string[]
): number {
  return calculateAbsoluteDifferenceScoreHelper(predictionRankings, resultRankings);
}

/**
 * Calculates points (LEGACY wrapper).
 */
export function calculatePoints(
  prediction: { firstPlaceId: string, secondPlaceId: string, thirdPlaceId: string },
  result: { firstPlaceId: string, secondPlaceId: string, thirdPlaceId: string },
  eventType: EventType
): number {
  const strategy = new LegacyTop3Strategy();
  return strategy.calculate(prediction, result, eventType);
}

/**
 * Validates a prediction based on scoring type.
 */
export function validatePrediction(
  prediction: PredictionResult, 
  scoringType: ScoringType = ScoringType.LEGACY_TOP3,
  expectedCount?: number
): boolean {
  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    if (!prediction.rankings || !Array.isArray(prediction.rankings)) return false;
    
    // Validate count if provided
    if (expectedCount !== undefined && prediction.rankings.length !== expectedCount) {
        return false;
    }

    // Check for duplicates
    const unique = new Set(prediction.rankings);
    return unique.size === prediction.rankings.length;
  }

  // Legacy Top 3 validation
  const drivers = [prediction.firstPlaceId, prediction.secondPlaceId, prediction.thirdPlaceId];
  // Ensure all 3 are present (truthy)
  if (!prediction.firstPlaceId || !prediction.secondPlaceId || !prediction.thirdPlaceId) return false;
  
  const uniqueDrivers = new Set(drivers);
  return uniqueDrivers.size === 3;
}

/**
 * Validates if an event has the necessary results for the scoring type.
 */
export function validateEventResults(
  event: { 
    results?: any; 
    firstPlaceId?: string | null; 
    secondPlaceId?: string | null; 
    thirdPlaceId?: string | null;
  },
  scoringType: ScoringType = ScoringType.LEGACY_TOP3
): boolean {
  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    return !!(event.results && Array.isArray(event.results) && event.results.length > 0);
  }
  return !!(event.firstPlaceId && event.secondPlaceId && event.thirdPlaceId);
}

/**
 * Calculates the leaderboard from a list of predictions.
 */
export function calculateLeaderboard(
  predictions: Array<{
    user: LeaderboardUser;
    points: number | null;
  }>,
  scoringType: ScoringType = ScoringType.LEGACY_TOP3
): Array<LeaderboardEntry> {
  const userStats = new Map<string, LeaderboardEntry>();

  for (const prediction of predictions) {
    if (prediction.points === null) continue;

    const userId = prediction.user.id;
    const existing = userStats.get(userId);

    if (existing) {
      existing.totalPoints += prediction.points;
      existing.eventCount += 1;
    } else {
      userStats.set(userId, {
        user: prediction.user,
        totalPoints: prediction.points,
        eventCount: 1,
        averagePoints: prediction.points // Initial average
      });
    }
  }

  // Finalize averages and convert to array
  const leaderboard = Array.from(userStats.values()).map(stats => {
    stats.averagePoints = stats.eventCount > 0 ? stats.totalPoints / stats.eventCount : 0;
    return stats;
  });

  // Sort based on scoring type
  return leaderboard.sort((a, b) => {
    if (scoringType === ScoringType.FULL_GRID_DIFF) {
      // Lower score wins
      return a.totalPoints - b.totalPoints;
    } else {
      // Higher score wins
      return b.totalPoints - a.totalPoints;
    }
  });
}

/**
 * Applica il moltiplicatore catch-up se il distacco dal leader >= soglia.
 * Restituisce lo score finale e il moltiplicatore usato.
 * Solo per FULL_GRID_DIFF: lo score viene ridotto (lower is better).
 */
export function applyCatchupMultiplier(
  score: number,
  gapFromLeader: number
): { finalScore: number; multiplier: number } {
  if (gapFromLeader >= CATCHUP_GAP_THRESHOLD) {
    return { finalScore: score * CATCHUP_MULTIPLIER, multiplier: CATCHUP_MULTIPLIER };
  }
  return { finalScore: score, multiplier: 1.0 };
}

/**
 * Calcola il gap dal leader per ogni userId basandosi sugli eventi COMPLETED
 * precedenti a beforeEventDate. Restituisce una Map<userId, gap>.
 * Il gap è 0 per il leader e per chi non ha pronostici passati.
 */
export async function getCatchupGapMap(
  predictions: Array<{
    user: LeaderboardUser;
    points: number | null;
  }>,
  scoringType: ScoringType
): Promise<Map<string, number>> {
  const gapMap = new Map<string, number>();

  if (predictions.length === 0) return gapMap;

  const leaderboard = calculateLeaderboard(predictions, scoringType);
  if (leaderboard.length === 0) return gapMap;

  const leaderTotal = leaderboard[0].totalPoints;

  for (const entry of leaderboard) {
    const gap = entry.totalPoints - leaderTotal;
    gapMap.set(entry.user.id, gap);
  }

  return gapMap;
}

export function canMakePrediction(event: { closingDate: Date; status: string }): boolean {
  const now = new Date();
  return event.status === 'UPCOMING' && now < event.closingDate;
}

export function formatEventDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().slice(0, 16).replace('T', ' ');
}

export function getTimeUntilClosing(closingDate: Date): string {
  const now = new Date();
  const diff = closingDate.getTime() - now.getTime();

  if (diff <= 0) return 'Chiuso';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Sorts predictions based on points and scoring type.
 * Handles null points by assigning appropriate penalty/fallback.
 */
export function sortPredictions<T extends { points: number | null }>(
  predictions: T[], 
  scoringType: ScoringType
): T[] {
  return [...predictions].sort((a, b) => {
    const penalty = scoringType === ScoringType.FULL_GRID_DIFF ? MISSING_DATA_PENALTY : -1;
    const pointsA = a.points ?? penalty;
    const pointsB = b.points ?? penalty;

    if (scoringType === ScoringType.FULL_GRID_DIFF) {
      return pointsA - pointsB;
    } else {
      return pointsB - pointsA;
    }
  });
}
