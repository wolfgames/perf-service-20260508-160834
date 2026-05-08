/**
 * Star rating — pure function, no Pixi, no Math.random.
 *
 * Thresholds per GDD:
 *   1 star = any finish (even 0 tokens)
 *   2 stars = ≥50% tokens collected
 *   3 stars = ≥90% tokens collected
 */
export const calcStars = (tokensCollected: number, tokensTotal: number): 1 | 2 | 3 => {
  if (tokensTotal === 0) return 1;
  const ratio = tokensCollected / tokensTotal;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
};
