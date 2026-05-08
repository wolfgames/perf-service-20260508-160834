/**
 * Solvability validator — rejects level configs that are unplayable.
 *
 * Rejection conditions:
 *   GAP_TOO_WIDE — gap > maxGapCells between consecutive platforms
 *   TOO_MANY_CONSECUTIVE_CRUMBLING — ≥2 crumbling platforms in a row
 *   COURSE_TOO_SHORT — fewer than 5 platforms
 */
import type { Platform } from '~/game/platformrush/logic/platformLogic';

const CELL_PX = 64;
const MAX_GAP_CELLS = 4; // absolute max; difficulty bands enforce stricter limits
const MIN_PLATFORMS = 5;

export interface CourseData {
  platforms: Platform[];
  tokens?: Array<{ x: number; y: number }>;
  obstacles?: Array<{ x: number; y: number; kind: string }>;
  finishFlagX?: number;
  source?: string;
}

export type ValidationFailure = 'GAP_TOO_WIDE' | 'TOO_MANY_CONSECUTIVE_CRUMBLING' | 'COURSE_TOO_SHORT';

export interface ValidationResult {
  valid: boolean;
  failure?: ValidationFailure;
}

export const validateSolvability = (course: CourseData): ValidationResult => {
  const { platforms } = course;

  if (platforms.length < MIN_PLATFORMS) {
    return { valid: false, failure: 'COURSE_TOO_SHORT' };
  }

  let consecutiveCrumbling = 0;

  for (let i = 1; i < platforms.length; i++) {
    const prev = platforms[i - 1];
    const curr = platforms[i];
    if (!prev || !curr) continue;

    // Gap check
    const gapPx = curr.x - (prev.x + prev.width);
    const gapCells = gapPx / CELL_PX;
    if (gapCells > MAX_GAP_CELLS) {
      return { valid: false, failure: 'GAP_TOO_WIDE' };
    }

    // Consecutive crumbling check
    if (curr.type === 'crumbling') {
      consecutiveCrumbling++;
      if (consecutiveCrumbling >= 2) {
        return { valid: false, failure: 'TOO_MANY_CONSECUTIVE_CRUMBLING' };
      }
    } else {
      consecutiveCrumbling = 0;
    }
  }

  return { valid: true };
};
