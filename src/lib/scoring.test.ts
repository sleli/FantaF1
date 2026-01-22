
import { calculateScore, calculateLeaderboard } from './scoring';
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
      // 1: 0-0 = 0
      // 2: |1-2| = 1
      // 3: |2-1| = 1
      // Total: 2
      const prediction = { rankings: ['1', '2', '3'] };
      const result = { results: ['1', '3', '2'] };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(2);
    });

    it('should penalize missing drivers in prediction', () => {
      // Pred: 1, 2 (missing 3)
      // Res:  1, 2, 3
      // 1: 0
      // 2: 0
      // 3: 20 (penalty)
      const prediction = { rankings: ['1', '2'] };
      const result = { results: ['1', '2', '3'] };
      const score = calculateScore(prediction, result, eventType, scoringType);
      expect(score).toBe(20);
    });

    it('should halve penalty for Sprint races', () => {
      // Pred: 1, 2, 3
      // Res:  1, 3, 2
      // Base penalty: 2
      // Sprint: 1
      const prediction = { rankings: ['1', '2', '3'] };
      const result = { results: ['1', '3', '2'] };
      const score = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
      expect(score).toBe(1);
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
        
        // d1 is pos 1 in result, pos 2 in pred -> diff 1
        // d2 is pos 2 in result, pos 1 in pred -> diff 1
        // others 0
        // total 2
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(2);
    });

    it('should handle SPRINT with large grid (half penalty)', () => {
        const predRankings = [...drivers];
        // Swap first two
        [predRankings[0], predRankings[1]] = [predRankings[1], predRankings[0]];
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        const score = calculateScore(prediction, result, 'SPRINT' as EventType, scoringType);
        expect(score).toBe(1); // 2 * 0.5
    });
    
    it('should penalize DNF/missing drivers in prediction for full grid', () => {
        // User forgot to include the last driver (d20)
        const predRankings = drivers.slice(0, 19); 
        
        const prediction = { rankings: predRankings };
        const result = { results: drivers };
        
        // d20 is missing from prediction. 
        // Penalty is usually 20 (max penalty).
        const score = calculateScore(prediction, result, eventType, scoringType);
        expect(score).toBe(20);
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
