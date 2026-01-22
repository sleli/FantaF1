
import { calculateScore } from './scoring';
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
});
