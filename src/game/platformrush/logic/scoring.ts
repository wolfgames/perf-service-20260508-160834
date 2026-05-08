/**
 * Scoring system — pure functions, no Pixi, no Math.random.
 *
 * finalScore = tokensCollected × TOKEN_SCORE × speedMultiplier
 * speedMultiplier = clamp(parTime / actualTime, 1.0, 2.0)
 *
 * Two multiplicative dimensions satisfy scoring CoS:
 *   - token count (magnitude)
 *   - speed efficiency (multiplier)
 */

export const TOKEN_SCORE = 10;

interface SpeedMultiplierArgs {
  parTimeMs: number;
  actualTimeMs: number;
}

export const calcSpeedMultiplier = ({ parTimeMs, actualTimeMs }: SpeedMultiplierArgs): number => {
  if (actualTimeMs <= 0) return 2.0;
  return Math.min(Math.max(parTimeMs / actualTimeMs, 1.0), 2.0);
};

interface ScoreArgs {
  tokensCollected: number;
  parTimeMs: number;
  actualTimeMs: number;
}

export const calcScore = ({ tokensCollected, parTimeMs, actualTimeMs }: ScoreArgs): number =>
  Math.round(tokensCollected * TOKEN_SCORE * calcSpeedMultiplier({ parTimeMs, actualTimeMs }));
