/**
 * levelGenerator — seeded procedural algorithm
 *
 * Determinism and constraint tests. No Pixi, no Math.random.
 */
import { describe, it, expect } from 'vitest';
import { generateLevel } from '~/game/platformrush/logic/levelGenerator';
import { validateSolvability } from '~/game/platformrush/logic/solvabilityValidator';

describe('levelGenerator — seeded procedural algorithm', () => {
  it('same seed produces identical course', () => {
    const a = generateLevel({ districtIndex: 1, courseIndex: 3 });
    const b = generateLevel({ districtIndex: 1, courseIndex: 3 });

    expect(JSON.stringify(a.platforms)).toBe(JSON.stringify(b.platforms));
    expect(JSON.stringify(a.tokens)).toBe(JSON.stringify(b.tokens));
  });

  it('district=0 course=2 gapRangeMax<=2', () => {
    // district 0 course 2 falls in difficulty band L0-7 (gapRangeMax=2)
    const level = generateLevel({ districtIndex: 0, courseIndex: 2 });
    const platforms = level.platforms;

    for (let i = 1; i < platforms.length; i++) {
      const prev = platforms[i - 1];
      const curr = platforms[i];
      if (!prev || !curr) continue;
      // Gap in cells = (curr.x - (prev.x + prev.width)) / 64
      const gapCells = (curr.x - (prev.x + prev.width)) / 64;
      if (gapCells > 0) {
        expect(gapCells).toBeLessThanOrEqual(2);
      }
    }
  });

  it('GAP_TOO_WIDE triggers retry up to 10 times', () => {
    // This tests that the generator retries when solvability fails.
    // We test by generating many levels and verifying all are solvable.
    for (let i = 0; i < 5; i++) {
      const level = generateLevel({ districtIndex: 0, courseIndex: i + 2 });
      const validation = validateSolvability(level);
      expect(validation.valid).toBe(true);
    }
  });

  it('10 failures falls back to fixture (produces a valid level)', () => {
    // Edge case: extreme courseIndex that would otherwise be hard to solve
    // Should still return a valid level (from fallback fixture if needed)
    const level = generateLevel({ districtIndex: 0, courseIndex: 99 });
    expect(level.platforms.length).toBeGreaterThan(0);
    expect(validateSolvability(level).valid).toBe(true);
  });

  it('generated level has at least 5 platforms', () => {
    const level = generateLevel({ districtIndex: 0, courseIndex: 2 });
    expect(level.platforms.length).toBeGreaterThanOrEqual(5);
  });

  it('different seeds produce different courses', () => {
    const a = generateLevel({ districtIndex: 0, courseIndex: 2 });
    const b = generateLevel({ districtIndex: 1, courseIndex: 2 });
    // Almost certainly different (different seeds)
    expect(JSON.stringify(a.platforms)).not.toBe(JSON.stringify(b.platforms));
  });
});
