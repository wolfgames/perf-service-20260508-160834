/**
 * Deterministic LCG random number generator.
 * No Math.random — seed-deterministic per GDD spec.
 *
 * LCG: next = (seed × 1664525 + 1013904223) mod 2^32
 * Seed formula: (districtIndex × 1000 + courseIndex) × 48271
 */

const MULT = 1664525;
const INC = 1013904223;
const MOD = 2 ** 32;

export interface Rng {
  next: () => number;    // 0..1 float
  nextInt: (max: number) => number; // 0..max-1 integer
}

export const createRng = (seed: number): Rng => {
  let state = ((seed % MOD) + MOD) % MOD;

  const next = (): number => {
    state = (MULT * state + INC) % MOD;
    return state / MOD;
  };

  const nextInt = (max: number): number => Math.floor(next() * max);

  return { next, nextInt };
};

export const seedFromLevel = (districtIndex: number, courseIndex: number): number =>
  (districtIndex * 1000 + courseIndex) * 48271;
