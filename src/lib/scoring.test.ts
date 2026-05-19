
import { calculateScore, calculateLeaderboard, calculateWorstPossibleScore, MISSING_DATA_PENALTY, applyCatchupMultiplier, getCatchupGapMap, CATCHUP_GAP_THRESHOLD, CATCHUP_MULTIPLIER, DEFAULT_FULL_GRID_SCORING_CONFIG, FullGridScoringConfig, sortPredictions, validateFullGridScoringConfig } from './scoring';
import { EventType, ScoringType } from '@prisma/client';

describe('Scoring System', () => {
  describe('Legacy Top 3 Scoring', () => {
    const eventType = 'RACE' as EventType;
    const scoringType = ScoringType.LEGACY_TOP3;

    it('should calculate perfect score correctly', () => {
      const prediction = { firstPlaceId: '1', secondPlaceId: '2', thirdPlaceId: '3' };
      const result = { firstPlaceId: '1', secondPlaceId: '2', thirdPlaceId: '3' };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(25 + 15 + 10); // 50
    });

    it('should calculate partial matches correctly', () => {
      // 1st correct (25), 2nd wrong pos (5), 3rd wrong (0)
      // prediction: 1, 3, 4
      // result:     1, 2, 3
      const prediction = { firstPlaceId: '1', secondPlaceId: '3', thirdPlaceId: '4' };
      const result = { firstPlaceId: '1', secondPlaceId: '2', thirdPlaceId: '3' };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(25 + 5 + 0); // 30
    });

    it('should handle Sprint races correctly (half points)', () => {
      const prediction = { firstPlaceId: '1', secondPlaceId: '2', thirdPlaceId: '3' };
      const result = { firstPlaceId: '1', secondPlaceId: '2', thirdPlaceId: '3' };
      const score = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
      expect(score).toBe(12.5 + 7.5 + 5); // 25
    });
  });

  describe('Full Grid Diff Scoring', () => {
    const eventType = 'RACE' as EventType;
    const scoringType = ScoringType.FULL_GRID_DIFF;

    it('should calculate perfect score (0 penalty)', () => {
      const prediction = { rankings: ['1', '2', '3'] };
      const result = { results: ['1', '2', '3'] };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(0);
    });

    it('should calculate differences correctly', () => {
      // Pred: 2, 1, 3
      // Res:  1, 3, 2
      // 1: actual pos 0, pred pos 1 → |1-0| = 1 × 0.8 = 0.8
      // 2: actual pos 2, pred pos 0 → |0-2| = 2 × 0.8 = 1.6
      // 3: actual pos 1, pred pos 2 → |2-1| = 1 × 0.8 = 0.8
      // Total: 3.2 (no podium bonus: pred[0]=2 ≠ res[0]=1)
      const prediction = { rankings: ['2', '1', '3'] };
      const result = { results: ['1', '3', '2'] };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(3.2);
    });

    it('should penalize missing drivers in prediction', () => {
      // Pred: 1, 2 (missing 3)
      // Res:  1, 2, 3
      // 1: 0
      // 2: 0
      // 3: actual pos 2 (top 10), 20 × 0.8 = 16
      const prediction = { rankings: ['1', '2'] };
      const result = { results: ['1', '2', '3'] };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(16);
    });

    it('should halve penalty for Sprint races', () => {
      // Pred: 2, 1, 3, 4
      // Res:  1, 3, 4, 2  (podium tutto sbagliato, no bonus)
      // d1: actual 0, pred 1 → |1-0|=1×0.8=0.8
      // d2: actual 3, pred 0 → |0-3|=3×0.8=2.4
      // d3: actual 1, pred 2 → |2-1|=1×0.8=0.8
      // d4: actual 2, pred 3 → |3-2|=1×0.8=0.8
      // Base: 4.8, Sprint: 2.4, Podium: pred[0]=2≠1 → no bonus
      const prediction = { rankings: ['2', '1', '3', '4'] };
      const result = { results: ['1', '3', '4', '2'] };
      const score = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
      expect(score).toBeCloseTo(2.4, 10);
    });

    it('should apply -50 bonus for perfect podium (all 3 exact)', () => {
      // Podio perfetto, ma errori fuori dal podio (swap posizioni 5 e 6)
      const drivers = ['1', '2', '3', '4', '5', '6', '7'];
      const predRankings = ['1', '2', '3', '4', '6', '5', '7']; // swap 5-6
      const prediction = { rankings: predRankings };
      const result = { results: drivers };
      // Base diff: 5 (actual pos 4) wrong, 6 (actual pos 5) wrong → both top 7 so top 10 weight 0.8
      // diff each = 1 × 0.8 = 0.8, total base = 1.6
      // Bonus podio perfetto: -50
      // Final: max(0, 1.6 - 50) = 0
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(0);
    });

    it('should apply -30 bonus for exact 1st and 2nd (3rd wrong)', () => {
      // 1° e 2° corretti, 3° sbagliato
      const drivers = ['1', '2', '3', '4', '5'];
      const predRankings = ['1', '2', '4', '3', '5']; // 3° sbagliato (pred 4, actual 3)
      const prediction = { rankings: predRankings };
      const result = { results: drivers };
      // Base diff: d3 actual pos 2 (top10)→|3-2|=1×0.8=0.8, d4 actual pos 3 (top10)→|2-3|=1×0.8=0.8
      // Base = 1.6
      // Bonus 1° e 2°: -30
      // Final: max(0, 1.6 - 30) = 0
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(0);
    });

    it('should apply -10 bonus for exact 1st only', () => {
      // Solo 1° corretto
      const drivers = ['1', '2', '3', '4', '5'];
      const predRankings = ['1', '3', '2', '4', '5']; // 2° e 3° scambiati
      const prediction = { rankings: predRankings };
      const result = { results: drivers };
      // Base diff: d2 actual pos 1→|2-1|=1×0.8=0.8, d3 actual pos 2→|1-2|=1×0.8=0.8
      // Base = 1.6
      // Bonus 1°: -10
      // Final: max(0, 1.6 - 10) = 0
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(0);
    });

    it('should apply no bonus when podium is completely wrong', () => {
      const drivers = ['1', '2', '3'];
      const predRankings = ['3', '2', '1']; // tutto sbagliato al podio
      const prediction = { rankings: predRankings };
      const result = { results: drivers };
      // Base diff: d1 actual pos 0→|2-0|=2×0.8=1.6, d2 actual pos 1→|1-1|=0, d3 actual pos 2→|0-2|=2×0.8=1.6
      // Base = 3.2, bonus = 0
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(3.2);
    });

    it('should apply no bonus when rankings have fewer than 3 entries', () => {
      const drivers = ['1', '2'];
      const predRankings = ['1', '2'];
      const prediction = { rankings: predRankings };
      const result = { results: drivers };
      // Base diff = 0 (perfect), bonus non applicabile (< 3 entries)
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(0);
    });

    it('should halve podium bonus for Sprint races', () => {
      // Sprint: podio perfetto, errori fuori → bonus effettivo -25
      const drivers = ['1', '2', '3', '4', '5', '6'];
      const predRankings = ['1', '2', '3', '4', '6', '5']; // swap 5-6
      const prediction = { rankings: predRankings };
      const result = { results: drivers };
      // Base diff: 1.6
      // Bonus podio perfetto: -50
      // Pre-sprint: 1.6 - 50 = -48.4
      // Sprint moltiplicatore: -48.4 * 0.5 = -24.2
      // Floor 0: 0
      const score = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
      expect(score).toBe(0);
    });

    it('should not go below 0 with large bonus on small base score', () => {
      // Podio perfetto, nessun errore → score = max(0, 0 - 50) = 0
      const drivers = ['1', '2', '3', '4', '5'];
      const predRankings = ['1', '2', '3', '4', '5'];
      const prediction = { rankings: predRankings };
      const result = { results: drivers };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(0);
    });

    it('should accept season-level custom weights and threshold', () => {
      const config: FullGridScoringConfig = {
        ...DEFAULT_FULL_GRID_SCORING_CONFIG,
        topGridThreshold: 1,
        topGridWeight: 2,
        lowerGridWeight: 3,
        podiumBonusExact: {
          first: 0,
          firstSecond: 0,
          topThree: 0,
        },
      };
      const prediction = { rankings: ['2', '1', '3'] };
      const result = { results: ['1', '2', '3'] };

      const score = calculateScore(prediction, result, eventType, scoringType, config);

      expect(score).toBe(5);
    });

    it('should allow disabling podium bonuses through season config', () => {
      const config: FullGridScoringConfig = {
        ...DEFAULT_FULL_GRID_SCORING_CONFIG,
        podiumBonusExact: {
          first: 0,
          firstSecond: 0,
          topThree: 0,
        },
      };
      const prediction = { rankings: ['1', '2', '3', '4', '6', '5'] };
      const result = { results: ['1', '2', '3', '4', '5', '6'] };

      const score = calculateScore(prediction, result, eventType, scoringType, config);

      expect(score).toBe(1.6);
    });

    it('should validate configurable full-grid values', () => {
      const invalid = validateFullGridScoringConfig({
        topGridThreshold: 0,
        topGridWeight: 0,
        lowerGridWeight: 1.2,
        podiumBonusExact: {
          first: 5,
          firstSecond: -30,
          topThree: -50,
        },
        catchup: {
          gapThreshold: 50,
          multiplier: 0.8,
        },
      });

      expect(invalid.isValid).toBe(false);
      expect(invalid.errors).toEqual(expect.arrayContaining([
        'La soglia top grid deve essere un intero positivo',
        'Il peso dei primi classificati deve essere positivo',
        'Il bonus 1° esatto deve essere minore o uguale a 0',
      ]));
    });
  });

  describe('Realistic Scenarios (20 Drivers)', () => {
    const eventType = 'RACE' as EventType;
    const scoringType = ScoringType.FULL_GRID_DIFF;
    const drivers = Array.from({ length: 20 }, (_, i) => `d${i + 1}`);

    it('should calculate perfect score for 20 drivers', () => {
      const prediction = { rankings: [...drivers] };
      const result = { results: [...drivers] };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(0);
    });

    it('should calculate penalty for inverted top 2 in full grid', () => {
        // Swap first two
        const predRankings = [...drivers];
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]]; // d2, d1, d3...
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d1: actual pos 0, pred pos 1 -> diff 1 × 0.8 = 0.8
        // d2: actual pos 1, pred pos 0 -> diff 1 × 0.8 = 0.8
        // others 0
        // total 1.6
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(1.6);
    });

    it('should handle SPRINT with large grid (half penalty)', () => {
        const predRankings = [...drivers];
        // Swap first two
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]];
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        const score = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
        expect(score).toBe(0.8); // 1.6 * 0.5
    });
    
    it('should penalize DNF/missing drivers in prediction for full grid', () => {
        // User forgot to include the last driver (d20)
        const predRankings = drivers.slice(0, 19);
        // Swap d1/d2 to break podium bonus (minimal change)
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]];
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d1: actual 0, pred 1 → |1-0|×0.8 = 0.8
        // d2: actual 1, pred 0 → |0-1|×0.8 = 0.8
        // d20 is missing: actual pos 19 (11+) → 20 × 1.2 = 24
        // Total: 25.6, no podium bonus
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBeCloseTo(25.6, 10);
    });

    it('should apply TOP10_WEIGHT (0.8) to drivers finishing 1-10', () => {
        // Swap driver at position 6 (actual pos 5) with position 7 (actual pos 6)
        // Both in top 10 → weight 0.8
        // Also swap d1/d2 to break podium bonus
        const predRankings = [...drivers];
        [predRankings[4], predRankings[5]] = [predRankings[5], predRankings[4]]; // swap d5, d6
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]]; // swap d1, d2
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d1: actual pos 0, pred pos 1 -> diff 1 × 0.8 = 0.8
        // d2: actual pos 1, pred pos 0 -> diff 1 × 0.8 = 0.8
        // d5: actual pos 4, pred pos 5 -> diff 1 × 0.8 = 0.8
        // d6: actual pos 5, pred pos 4 -> diff 1 × 0.8 = 0.8
        // Total: 3.2, no podium bonus
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(3.2);
    });

    it('should apply LOW_GRID_WEIGHT (1.2) to drivers finishing 11+', () => {
        // Swap driver at position 15 (actual pos 14) with position 16 (actual pos 15)
        // Both 11+ → weight 1.2
        // Also swap d1/d2 to break podium bonus
        const predRankings = [...drivers];
        [predRankings[14], predRankings[15]] = [predRankings[15], predRankings[14]]; // swap d15, d16
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]]; // swap d1, d2
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d1: actual pos 0, pred pos 1 -> diff 1 × 0.8 = 0.8
        // d2: actual pos 1, pred pos 0 -> diff 1 × 0.8 = 0.8
        // d15: actual pos 14, pred pos 15 -> diff 1 × 1.2 = 1.2
        // d16: actual pos 15, pred pos 14 -> diff 1 × 1.2 = 1.2
        // Total: 4.0, no podium bonus
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(4.0);
    });

    it('should penalize missing top-10 driver less than missing bottom driver', () => {
        // When a driver is missing from prediction, all subsequent drivers shift.
        // Missing d2 (actual pos 1, top 10): base 34.4, swap d1/d3 → 36.0
        const predWithoutD2 = drivers.filter(id => id !== 'd2');
        // Swap d1/d3 to break podium bonus (d2 is missing, can't swap d1/d2)
        [predWithoutD2[0], predWithoutD2[1]] = [predWithoutD2[1], predWithoutD2[0]];
        const prediction = { rankings: predWithoutD2 };
        const result = { results: drivers };
        const scoreTop10Missing = calculateScore(prediction, result, eventType, scoringType);
        expect(scoreTop10Missing).toBeCloseTo(36.0, 10);

        // Missing d15 (actual pos 14, 11+): base 30, swap d1/d2 → 31.6
        const predWithoutD15 = drivers.filter(id => id !== 'd15');
        // Swap d1/d2 to break podium bonus
        [predWithoutD15[0], predWithoutD15[1]] = [predWithoutD15[1], predWithoutD15[0]];
        const prediction2 = { rankings: predWithoutD15 };
        const scoreBottomMissing = calculateScore(prediction2, result, eventType, scoringType);
        expect(scoreBottomMissing).toBeCloseTo(31.6, 10);
    });

    it('should apply correct weight at the boundary (position 10 vs 11)', () => {
        // Position 10 (0-indexed 9): top 10 → weight 0.8
        // Position 11 (0-indexed 10): 11+ → weight 1.2
        // Also swap d1/d2 to break podium bonus
        const predRankings = [...drivers];
        // Swap d10 (pos 9, top 10) with d11 (pos 10, 11+)
        [predRankings[9], predRankings[10]] = [predRankings[10], predRankings[9]];
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]]; // swap d1, d2
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d1: actual pos 0, pred pos 1 -> diff 1 × 0.8 = 0.8
        // d2: actual pos 1, pred pos 0 -> diff 1 × 0.8 = 0.8
        // d10: actual pos 9 (top 10), pred pos 10 -> diff 1 × 0.8 = 0.8
        // d11: actual pos 10 (11+), pred pos 9 -> diff 1 × 1.2 = 1.2
        // Total: 3.6, no podium bonus
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBeCloseTo(3.6, 10);
    });

    it('should handle weighted sprint correctly', () => {
        // Swap first two (top 10) → base 1.6, sprint: 0.8
        // Podium broken (d2,d1 → no bonus), so unchanged
        const predRankings = [...drivers];
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]];
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        const sprintScore = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
        expect(sprintScore).toBe(0.8);

        // Swap bottom two (11+) AND swap d1/d2 to break podium bonus
        // base 2.4 + d1/d2 swap (1.6) = 4.0, sprint: 2.0
        const predRankings2 = [...drivers];
        [predRankings2[18], predRankings2[19]] = [predRankings2[19], predRankings2[18]];
        [predRankings2[0], predRankings2[1]] = [predRankings2[1], predRankings2[0]];
        const prediction2 = { rankings: predRankings2 };
        
        const sprintScore2 = calculateScore(prediction2, result, 'SPRINT' as EventType, scoringType);
        expect(sprintScore2).toBe(2.0);
    });
  });

  describe('Worst Possible Score', () => {
    it('should calculate worst score for 20 drivers', () => {
      expect(calculateWorstPossibleScore(20)).toBe(200);
    });

    it('should calculate worst score for 21 drivers', () => {
      expect(calculateWorstPossibleScore(21)).toBe(220);
    });

    it('should calculate worst score for 22 drivers', () => {
      expect(calculateWorstPossibleScore(22)).toBe(242);
    });

    it('should return 0 for 1 driver', () => {
      expect(calculateWorstPossibleScore(1)).toBe(0);
    });
  });

  describe('Empty Prediction (no previous prediction)', () => {
    const scoringType = ScoringType.FULL_GRID_DIFF;
    const drivers20 = Array.from({ length: 20 }, (_, i) => `d${i + 1}`);

    it('should assign worst possible score for empty prediction on RACE', () => {
      const prediction = { rankings: [] };
      const result = { results: drivers20 };
      const score = calculateScore(prediction, result, 'RACE' as EventType, scoringType);
      expect(score).toBe(200);
    });

    it('should assign half worst score for empty prediction on SPRINT', () => {
      const prediction = { rankings: [] };
      const result = { results: drivers20 };
      const score = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
      expect(score).toBe(100);
    });

    it('should return MISSING_DATA_PENALTY when results are empty', () => {
      const prediction = { rankings: ['d1', 'd2'] };
      const result = { results: [] };
      const score = calculateScore(prediction, result, 'RACE' as EventType, scoringType);
      expect(score).toBe(MISSING_DATA_PENALTY);
    });
  });

  describe('Leaderboard Calculation', () => {
    it('should aggregate points correctly for FULL_GRID_DIFF (Low Score wins)', () => {
        const predictions = [
            { user: { id: 'u1', name: 'User 1', email: 'u1@test.com' }, points: 10 },
            { user: { id: 'u2', name: 'User 2', email: 'u2@test.com' }, points: 5 },
            { user: { id: 'u1', name: 'User 1', email: 'u1@test.com' }, points: 15 }, // u1 total: 25
            { user: { id: 'u2', name: 'User 2', email: 'u2@test.com' }, points: 0 },  // u2 total: 5
        ];

        // FULL_GRID_DIFF: Lower is better
        const leaderboard = calculateLeaderboard(predictions, ScoringType.FULL_GRID_DIFF);

        expect(leaderboard).toHaveLength(2);
        
        // Winner should be u2 (5 points)
        expect(leaderboard[0].user.id).toBe('u2');
        expect(leaderboard[0].totalPoints).toBe(5);
        expect(leaderboard[0].eventCount).toBe(2);
        
        // Second is u1 (25 points)
        expect(leaderboard[1].user.id).toBe('u1');
        expect(leaderboard[1].totalPoints).toBe(25);
    });

    it('should aggregate points correctly for LEGACY_TOP3 (High Score wins)', () => {
        const predictions = [
            { user: { id: 'u1', name: 'User 1', email: 'u1@test.com' }, points: 50 },
            { user: { id: 'u2', name: 'User 2', email: 'u2@test.com' }, points: 30 },
            { user: { id: 'u1', name: 'User 1', email: 'u1@test.com' }, points: 25 }, // u1 total: 75
        ];

        // LEGACY_TOP3: Higher is better
        const leaderboard = calculateLeaderboard(predictions, ScoringType.LEGACY_TOP3);

        expect(leaderboard[0].user.id).toBe('u1');
        expect(leaderboard[0].totalPoints).toBe(75);
        
        expect(leaderboard[1].user.id).toBe('u2');
        expect(leaderboard[1].totalPoints).toBe(30);
    });

    it('should sort a perfect FULL_GRID_DIFF event score before worse scores', () => {
      const predictions = [
        { points: 12 },
        { points: 0 },
        { points: null },
      ];

      const sorted = sortPredictions(predictions, ScoringType.FULL_GRID_DIFF);

      expect(sorted.map(p => p.points)).toEqual([0, 12, null]);
    });
  });

  describe('Catchup Multiplier', () => {
    describe('applyCatchupMultiplier', () => {
      it('should apply 0.8x when gap equals threshold', () => {
        const result = applyCatchupMultiplier(100, CATCHUP_GAP_THRESHOLD);
        expect(result.finalScore).toBe(100 * CATCHUP_MULTIPLIER);
        expect(result.multiplier).toBe(CATCHUP_MULTIPLIER);
      });

      it('should apply 0.8x when gap exceeds threshold', () => {
        const result = applyCatchupMultiplier(100, 100);
        expect(result.finalScore).toBe(100 * CATCHUP_MULTIPLIER);
        expect(result.multiplier).toBe(CATCHUP_MULTIPLIER);
      });

      it('should NOT apply multiplier when gap is below threshold', () => {
        const result = applyCatchupMultiplier(100, CATCHUP_GAP_THRESHOLD - 1);
        expect(result.finalScore).toBe(100);
        expect(result.multiplier).toBe(1.0);
      });

      it('should NOT apply multiplier when gap is 0 (leader)', () => {
        const result = applyCatchupMultiplier(50, 0);
        expect(result.finalScore).toBe(50);
        expect(result.multiplier).toBe(1.0);
      });

      it('should multiply by 0.8 for any score value', () => {
        const result = applyCatchupMultiplier(42.5, 60);
        expect(result.finalScore).toBeCloseTo(34, 10);
        expect(result.multiplier).toBe(0.8);
      });

      it('should use custom catch-up threshold and multiplier from season config', () => {
        const config: FullGridScoringConfig = {
          ...DEFAULT_FULL_GRID_SCORING_CONFIG,
          catchup: {
            gapThreshold: 20,
            multiplier: 0.5,
          },
        };

        expect(applyCatchupMultiplier(100, 19, config)).toEqual({
          finalScore: 100,
          multiplier: 1.0,
        });
        expect(applyCatchupMultiplier(100, 20, config)).toEqual({
          finalScore: 50,
          multiplier: 0.5,
        });
      });
    });

    describe('getCatchupGapMap', () => {
      it('should return empty map for empty predictions', async () => {
        const gapMap = await getCatchupGapMap([], ScoringType.FULL_GRID_DIFF);
        expect(gapMap.size).toBe(0);
      });

      it('should return gap 0 for leader', async () => {
        const predictions = [
          { user: { id: 'u1', name: 'A', email: 'a@t.com' }, points: 10 },
          { user: { id: 'u2', name: 'B', email: 'b@t.com' }, points: 30 },
        ];
        const gapMap = await getCatchupGapMap(predictions, ScoringType.FULL_GRID_DIFF);
        expect(gapMap.get('u1')).toBe(0);
        expect(gapMap.get('u2')).toBe(20);
      });

      it('should compute gaps correctly for multiple users', async () => {
        const predictions = [
          { user: { id: 'u1', name: 'A', email: 'a@t.com' }, points: 5 },
          { user: { id: 'u2', name: 'B', email: 'b@t.com' }, points: 15 },
          { user: { id: 'u3', name: 'C', email: 'c@t.com' }, points: 70 },
          { user: { id: 'u1', name: 'A', email: 'a@t.com' }, points: 10 },
          { user: { id: 'u2', name: 'B', email: 'b@t.com' }, points: 20 },
        ];
        const gapMap = await getCatchupGapMap(predictions, ScoringType.FULL_GRID_DIFF);
        // u1: 5+10 = 15 (leader)
        // u2: 15+20 = 35 (gap 20)
        // u3: 70 (gap 55)
        expect(gapMap.get('u1')).toBe(0);
        expect(gapMap.get('u2')).toBe(20);
        expect(gapMap.get('u3')).toBe(55);
      });

      it('should handle tied leaders (both get gap 0)', async () => {
        const predictions = [
          { user: { id: 'u1', name: 'A', email: 'a@t.com' }, points: 10 },
          { user: { id: 'u2', name: 'B', email: 'b@t.com' }, points: 10 },
          { user: { id: 'u3', name: 'C', email: 'c@t.com' }, points: 30 },
        ];
        const gapMap = await getCatchupGapMap(predictions, ScoringType.FULL_GRID_DIFF);
        // u1 and u2 tied at 10 (both leader)
        expect(gapMap.get('u1')).toBe(0);
        expect(gapMap.get('u2')).toBe(0);
        expect(gapMap.get('u3')).toBe(20);
      });

      it('should handle single user (gap 0)', async () => {
        const predictions = [
          { user: { id: 'u1', name: 'A', email: 'a@t.com' }, points: 42 },
        ];
        const gapMap = await getCatchupGapMap(predictions, ScoringType.FULL_GRID_DIFF);
        expect(gapMap.get('u1')).toBe(0);
      });
    });

    describe('Catchup integration scenario', () => {
      it('user with gap >= 50 should get multiplier, leader should not', async () => {
        // Simulated leaderboard before event
        const pastPredictions = [
          { user: { id: 'leader', name: 'L', email: 'l@t.com' }, points: 30 },
          { user: { id: 'chaser', name: 'C', email: 'c@t.com' }, points: 90 },
        ];
        const gapMap = await getCatchupGapMap(pastPredictions, ScoringType.FULL_GRID_DIFF);

        const leaderGap = gapMap.get('leader') ?? 0;
        const chaserGap = gapMap.get('chaser') ?? 0;

        // Leader gets no multiplier
        const leaderResult = applyCatchupMultiplier(20, leaderGap);
        expect(leaderResult.finalScore).toBe(20);
        expect(leaderResult.multiplier).toBe(1.0);

        // Chaser (gap 60) gets 0.8x
        const chaserResult = applyCatchupMultiplier(25, chaserGap);
        expect(chaserResult.finalScore).toBe(20); // 25 * 0.8 = 20
        expect(chaserResult.multiplier).toBe(0.8);
      });

      it('user with gap exactly at threshold should get multiplier', async () => {
        // Gap = exactly 50
        const predictions = [
          { user: { id: 'u1', name: 'A', email: 'a@t.com' }, points: 10 },
          { user: { id: 'u2', name: 'B', email: 'b@t.com' }, points: 60 },
        ];
        const gapMap = await getCatchupGapMap(predictions, ScoringType.FULL_GRID_DIFF);
        const u2Gap = gapMap.get('u2') ?? 0;
        expect(u2Gap).toBe(50);

        const result = applyCatchupMultiplier(30, u2Gap);
        expect(result.multiplier).toBe(0.8);
        expect(result.finalScore).toBe(24);
      });

      it('user with gap at threshold-1 should NOT get multiplier', async () => {
        // Gap = 49
        const predictions = [
          { user: { id: 'u1', name: 'A', email: 'a@t.com' }, points: 10 },
          { user: { id: 'u2', name: 'B', email: 'b@t.com' }, points: 59 },
        ];
        const gapMap = await getCatchupGapMap(predictions, ScoringType.FULL_GRID_DIFF);
        const u2Gap = gapMap.get('u2') ?? 0;
        expect(u2Gap).toBe(49);

        const result = applyCatchupMultiplier(30, u2Gap);
        expect(result.multiplier).toBe(1.0);
        expect(result.finalScore).toBe(30);
      });
    });
  });
});
