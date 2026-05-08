/**
 * scoring — formula and star thresholds
 */
import { describe, it, expect } from 'vitest';
import { calcScore, calcSpeedMultiplier } from '~/game/platformrush/logic/scoring';
import { calcStars } from '~/game/platformrush/logic/starRating';

describe('scoring — formula and star thresholds', () => {
  it('score = tokenScore * speedMultiplier', () => {
    // 5 tokens * 10 * 1.0 multiplier = 50
    const score = calcScore({ tokensCollected: 5, parTimeMs: 1000, actualTimeMs: 1000 });
    expect(score).toBe(50);
  });

  it('speedMultiplier clamped to [1.0, 2.0]', () => {
    // Finishing at half parTime → multiplier = 2.0
    expect(calcSpeedMultiplier({ parTimeMs: 1000, actualTimeMs: 500 })).toBe(2.0);

    // Finishing at 3× parTime → multiplier clamped at 1.0
    expect(calcSpeedMultiplier({ parTimeMs: 1000, actualTimeMs: 3000 })).toBe(1.0);

    // At parTime → exactly 1.0
    expect(calcSpeedMultiplier({ parTimeMs: 1000, actualTimeMs: 1000 })).toBe(1.0);
  });

  it('1 star: any finish; 2 stars: >=50% tokens; 3 stars: >=90% tokens', () => {
    expect(calcStars(0, 10)).toBe(1);   // 0% tokens
    expect(calcStars(4, 10)).toBe(1);   // 40% tokens
    expect(calcStars(5, 10)).toBe(2);   // 50% tokens
    expect(calcStars(8, 10)).toBe(2);   // 80% tokens
    expect(calcStars(9, 10)).toBe(3);   // 90% tokens
    expect(calcStars(10, 10)).toBe(3);  // 100% tokens
  });

  it('skilled player score >= 3x beginner on same course', () => {
    const tokensTotal = 10;
    const parTimeMs = 2000;

    // Beginner: 0 tokens, slow (3x parTime)
    const beginnerScore = calcScore({
      tokensCollected: 0,
      parTimeMs,
      actualTimeMs: parTimeMs * 3,
    });

    // Skilled: all tokens, fast (0.5x parTime)
    const skilledScore = calcScore({
      tokensCollected: tokensTotal,
      parTimeMs,
      actualTimeMs: parTimeMs * 0.5,
    });

    // Skilled score should be ≥3× beginner (or beginner=0, skilled>0)
    if (beginnerScore === 0) {
      expect(skilledScore).toBeGreaterThan(0);
    } else {
      expect(skilledScore / beginnerScore).toBeGreaterThanOrEqual(3);
    }
  });
});
