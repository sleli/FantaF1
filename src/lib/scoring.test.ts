
import { calculateScore, calculateLeaderboard, calculateWorstPossibleScore, MISSING_DATA_PENALTY } from './scoring';
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
      // Pred: 1, 2, 3
      // Res:  1, 3, 2
      // 1: |0-0| = 0
      // 2: actual pos 2 (top 10), |1-2| = 1 × 0.8 = 0.8
      // 3: actual pos 1 (top 10), |2-1| = 1 × 0.8 = 0.8
      // Total: 1.6
      const prediction = { rankings: ['1', '2', '3'] };
      const result = { results: ['1', '3', '2'] };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(1.6);
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
      // Pred: 1, 2, 3
      // Res:  1, 3, 2
      // Base penalty: 1.6
      // Sprint: 0.8
      const prediction = { rankings: ['1', '2', '3'] };
      const result = { results: ['1', '3', '2'] };
      const score = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
      expect(score).toBe(0.8);
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
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d20 is missing from prediction.
        // actual pos 19 -> weight 1.2, so penalty = 20 × 1.2 = 24
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(24);
    });

    it('should apply TOP10_WEIGHT (0.8) to drivers finishing 1-10', () => {
        // Swap driver at position 6 (actual pos 5) with position 7 (actual pos 6)
        // Both in top 10 → weight 0.8
        const predRankings = [...drivers];
        [predRankings[4], predRankings[5]] = [predRankings[5], predRankings[4]]; // swap d5, d6
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d5: actual pos 4, pred pos 5 -> diff 1 × 0.8 = 0.8
        // d6: actual pos 5, pred pos 4 -> diff 1 × 0.8 = 0.8
        // Total: 1.6
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(1.6);
    });

    it('should apply LOW_GRID_WEIGHT (1.2) to drivers finishing 11+', () => {
        // Swap driver at position 15 (actual pos 14) with position 16 (actual pos 15)
        // Both 11+ → weight 1.2
        const predRankings = [...drivers];
        [predRankings[14], predRankings[15]] = [predRankings[15], predRankings[14]]; // swap d15, d16
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d15: actual pos 14, pred pos 15 -> diff 1 × 1.2 = 1.2
        // d16: actual pos 15, pred pos 14 -> diff 1 × 1.2 = 1.2
        // Total: 2.4
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(2.4);
    });

    it('should penalize missing top-10 driver less than missing bottom driver', () => {
        // When a driver is missing from prediction, all subsequent drivers shift.
        // Missing d2 (actual pos 1, top 10): 16 (penalty) + 8×0.8 (d3-d10 shift) + 10×1.2 (d11-d20 shift) = 34.4
        const predWithoutD2 = drivers.filter(id => id !== 'd2');
        const prediction = { rankings: predWithoutD2 };
        const result = { results: drivers };
        const scoreTop10Missing = calculateScore(prediction, result, eventType, scoringType);
        expect(scoreTop10Missing).toBeCloseTo(34.4, 10);

        // Missing d15 (actual pos 14, 11+): 24 (penalty) + 5×1.2 (d16-d20 shift) = 30.0
        const predWithoutD15 = drivers.filter(id => id !== 'd15');
        const prediction2 = { rankings: predWithoutD15 };
        const scoreBottomMissing = calculateScore(prediction2, result, eventType, scoringType);
        expect(scoreBottomMissing).toBeCloseTo(30, 10);
    });

    it('should apply correct weight at the boundary (position 10 vs 11)', () => {
        // Position 10 (0-indexed 9): top 10 → weight 0.8
        // Position 11 (0-indexed 10): 11+ → weight 1.2
        const predRankings = [...drivers];
        // Swap d10 (pos 9, top 10) with d11 (pos 10, 11+)
        [predRankings[9], predRankings[10]] = [predRankings[10], predRankings[9]];
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d10: actual pos 9 (top 10), pred pos 10 -> diff 1 × 0.8 = 0.8
        // d11: actual pos 10 (11+), pred pos 9 -> diff 1 × 1.2 = 1.2
        // Total: 2.0
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(2.0);
    });

    it('should handle weighted sprint correctly', () => {
        // Swap first two (top 10) → base 1.6, sprint: 0.8
        const predRankings = [...drivers];
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]];
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        const sprintScore = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
        expect(sprintScore).toBe(0.8);

        // Swap bottom two (11+) → base 2.4, sprint: 1.2
        const predRankings2 = [...drivers];
        [predRankings2[18], predRankings2[19]] = [predRankings2[19], predRankings2[18]];
        const prediction2 = { rankings: predRankings2 };
        
        const sprintScore2 = calculateScore(prediction2, result, 'SPRINT' as EventType, scoringType);
        expect(sprintScore2).toBe(1.2);
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
  });
});
