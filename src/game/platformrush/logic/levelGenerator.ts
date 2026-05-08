/**
 * PlatformRush level generator — deterministic seeded procedural algorithm.
 *
 * 6-step algorithm per GDD:
 *   1. Seed → RNG
 *   2. Difficulty params from level index
 *   3. Platform sequence
 *   4. Obstacle placement
 *   5. Token placement
 *   6. Solvability validation (retry up to 10 times; fallback to fixture)
 *
 * No Math.random. All randomness via seedFromLevel → createRng.
 */
import { createRng, seedFromLevel } from '~/game/platformrush/logic/rng';
import { validateSolvability, type CourseData, type ValidationFailure } from '~/game/platformrush/logic/solvabilityValidator';
import type { Platform } from '~/game/platformrush/logic/platformLogic';
import fallback0 from '~/game/platformrush/data/courses/district-0/fallback.json';

// Inline fallback lookup to avoid circular dependency with courseLoader
const getFallback = (districtIndex: number): CourseData => {
  if (districtIndex === 0) {
    return fallback0 as unknown as CourseData;
  }
  return fallback0 as unknown as CourseData;
};

const CELL_W = 64;  // platform cell width
const CELL_H = 24;  // platform cell height
const GROUND_Y_LEVEL = 500; // platform top y (fixed horizontal runner level)
const COURSE_PLATFORMS = 12; // platforms per course

/** Difficulty parameters per level band */
interface DifficultyParams {
  gapRangeMax: number;
  obstacleChance: number;
  crumblingChance: number;
  bouncyChance: number;
}

const difficultyForLevel = (levelIndex: number): DifficultyParams => {
  if (levelIndex < 8) {
    return { gapRangeMax: 2, obstacleChance: 0.05, crumblingChance: 0, bouncyChance: 0 };
  }
  if (levelIndex < 16) {
    return { gapRangeMax: 3, obstacleChance: 0.15, crumblingChance: 0.1, bouncyChance: 0.05 };
  }
  return { gapRangeMax: 4, obstacleChance: 0.25, crumblingChance: 0.2, bouncyChance: 0.1 };
};

const levelIndex = (districtIndex: number, courseIndex: number): number =>
  districtIndex * 8 + courseIndex;

interface GenerateOptions {
  districtIndex: number;
  courseIndex: number;
}

const generateOnce = (options: GenerateOptions, seed: number): CourseData => {
  const { districtIndex, courseIndex } = options;
  const rng = createRng(seed);
  const params = difficultyForLevel(levelIndex(districtIndex, courseIndex));

  // Step 3: Platform sequence
  const platforms: Platform[] = [];
  let x = 0;

  for (let i = 0; i < COURSE_PLATFORMS; i++) {
    const width = CELL_W * (2 + rng.nextInt(3)); // 2–4 cells wide

    // Determine type
    let type: Platform['type'] = 'normal';
    if (i > 1) { // first 2 platforms always normal (safe start zone)
      const prevType = platforms[platforms.length - 1]?.type ?? 'normal';
      if (params.crumblingChance > 0 && rng.next() < params.crumblingChance && prevType !== 'crumbling') {
        type = 'crumbling';
      } else if (params.bouncyChance > 0 && rng.next() < params.bouncyChance) {
        type = 'bouncy';
      }
    }

    platforms.push({ x, y: GROUND_Y_LEVEL, width, type });

    // Gap to next platform
    const gapCells = 1 + rng.nextInt(params.gapRangeMax);
    x += width + gapCells * CELL_W;
  }

  // Last platform: finish flag platform — always wide normal
  platforms.push({ x, y: GROUND_Y_LEVEL, width: CELL_W * 4, type: 'normal' });

  // Step 4: Obstacles — only on normal platforms (not first 2)
  const obstacles: CourseData['obstacles'] = [];
  for (const platform of platforms.slice(2)) {
    if (platform.type !== 'normal') continue;
    if (rng.next() < params.obstacleChance) {
      obstacles.push({
        x: platform.x + platform.width * 0.75,
        y: platform.y,
        kind: rng.next() < 0.5 ? 'crate' : 'fan',
      });
    }
  }

  // Step 5: Token placement (0.4 density, never over gaps, never on obstacles)
  const obstacleXs = new Set(obstacles.map(o => Math.floor(o.x)));
  const tokens: CourseData['tokens'] = [];
  for (const platform of platforms) {
    if (rng.next() < 0.4) {
      const tokenX = platform.x + platform.width / 2;
      if (!obstacleXs.has(Math.floor(tokenX))) {
        tokens.push({ x: tokenX, y: platform.y - 40 });
      }
    }
  }

  return { platforms, tokens, obstacles, source: 'procedural' };
};

export const generateLevel = (options: GenerateOptions): CourseData => {
  const baseSeed = seedFromLevel(options.districtIndex, options.courseIndex);
  let lastFailure: ValidationFailure | undefined;

  for (let attempt = 0; attempt < 10; attempt++) {
    const course = generateOnce(options, baseSeed + attempt);
    const result = validateSolvability(course);
    if (result.valid) return course;
    lastFailure = result.failure;
  }

  // After 10 failures, use fallback fixture (import inline to avoid circular dep)
  console.warn(`[levelGenerator] 10 attempts failed (${String(lastFailure)}), using fallback fixture`);
  return getFallback(options.districtIndex);
};
