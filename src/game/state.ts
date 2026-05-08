import { createSignal, createRoot } from 'solid-js';
import type { BoardState } from '~/game/platformrush/state/types';

/**
 * Game state that persists across screens.
 * Created in a root to avoid disposal issues.
 *
 * PlatformRush extends this with ECS bridging for score/stars/level.
 * ECS is the source of truth; signals are the DOM bridge.
 * Pause state lives in core/systems/pause (scaffold feature).
 */

export interface GameState {
  score: () => number;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;

  level: () => number;
  setLevel: (level: number) => void;
  incrementLevel: () => void;

  stars: () => number;
  setStars: (stars: number) => void;

  tokensCollected: () => number;
  setTokensCollected: (n: number) => void;

  tokensTotal: () => number;
  setTokensTotal: (n: number) => void;

  retriesRemaining: () => number;
  setRetriesRemaining: (n: number) => void;

  boardState: () => BoardState | null;
  setBoardState: (state: BoardState | null) => void;

  reset: () => void;
}

export function createGameState(): GameState {
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [stars, setStars] = createSignal(0);
  const [tokensCollected, setTokensCollected] = createSignal(0);
  const [tokensTotal, setTokensTotal] = createSignal(0);
  const [retriesRemaining, setRetriesRemaining] = createSignal(1);
  const [boardState, setBoardState] = createSignal<BoardState | null>(null);

  return {
    score,
    setScore,
    addScore: (amount: number) => setScore((s) => s + amount),

    level,
    setLevel,
    incrementLevel: () => setLevel((l) => l + 1),

    stars,
    setStars,

    tokensCollected,
    setTokensCollected,

    tokensTotal,
    setTokensTotal,

    retriesRemaining,
    setRetriesRemaining,

    boardState,
    setBoardState,

    reset: () => {
      setScore(0);
      setLevel(1);
      setStars(0);
      setTokensCollected(0);
      setTokensTotal(0);
      setRetriesRemaining(1);
      setBoardState(null);
    },
  };
}

export const gameState = createRoot(createGameState);
