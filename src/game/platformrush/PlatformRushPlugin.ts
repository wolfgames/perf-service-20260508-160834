/**
 * PlatformRush ECS Plugin — source of truth for all game state.
 *
 * Property order is runtime-enforced:
 * extends → services → components → resources → archetypes →
 * computed → transactions → actions → systems
 *
 * No Pixi imports. No Math.random. Pure state logic only.
 */
import { Database } from '@adobe/data/ecs';
import { F32 } from '@adobe/data/math';
import { Observe } from '@adobe/data/observe';

import { BoardState, type BoardState as BoardStateType } from '~/game/platformrush/state/types';
import { calcStars } from '~/game/platformrush/logic/starRating';

// ── Plugin ──────────────────────────────────────────────────────────────────

export const platformRushPlugin = Database.Plugin.create({
  components: {
    // Platform entity components
    platformX: F32.schema,
    platformY: F32.schema,
    platformWidth: F32.schema,
    platformType: { type: 'string', default: 'normal' } as const,
    crumbleTimer: F32.schema,

    // Obstacle entity components
    obstacleX: F32.schema,
    obstacleY: F32.schema,
    obstacleKind: { type: 'string', default: 'crate' } as const,

    // Token entity components
    tokenX: F32.schema,
    tokenY: F32.schema,
    tokenCollected: { type: 'boolean', default: false } as const,
  },

  resources: {
    score: { default: 0 as number },
    starsEarned: { default: 0 as number },
    tokensCollected: { default: 0 as number },
    tokensTotal: { default: 0 as number },
    retriesRemaining: { default: 1 as number },
    districtIndex: { default: 0 as number },
    courseIndex: { default: 0 as number },
    boardState: { default: BoardState.IDLE as BoardStateType },
    runnerX: { default: 0 as number },
    runnerY: { default: 0 as number },
    runnerVY: { default: 0 as number },
    scrollOffset: { default: 0 as number },
    courseLength: { default: 0 as number },
    finishFlagX: { default: 0 as number },
    elapsedMs: { default: 0 as number },
    parTimeMs: { default: 0 as number },
  },

  archetypes: {
    Platform: ['platformX', 'platformY', 'platformWidth', 'platformType', 'crumbleTimer'],
    Obstacle: ['obstacleX', 'obstacleY', 'obstacleKind'],
    Token: ['tokenX', 'tokenY', 'tokenCollected'],
  },

  computed: {
    progressRatio: (db) =>
      Observe.withFilter(
        Observe.fromProperties({
          runnerX: db.observe.resources.runnerX,
          finishFlagX: db.observe.resources.finishFlagX,
        }),
        ({ runnerX, finishFlagX }) =>
          finishFlagX > 0 ? Math.min(runnerX / finishFlagX, 1) : 0,
      ),
  },

  transactions: {
    addScore(store, amount: number) {
      store.resources.score = store.resources.score + amount;
    },

    setBoard(store, state: BoardStateType) {
      store.resources.boardState = state;
    },

    replaceLevel(store, { tokensTotal, courseLength = 0, finishFlagX = 0, parTimeMs = 0 }: {
      tokensTotal: number;
      courseLength?: number;
      finishFlagX?: number;
      parTimeMs?: number;
    }) {
      store.resources.tokensTotal = tokensTotal;
      store.resources.tokensCollected = 0;
      store.resources.score = 0;
      store.resources.starsEarned = 0;
      store.resources.retriesRemaining = 1;
      store.resources.boardState = BoardState.IDLE;
      store.resources.runnerX = 0;
      store.resources.runnerY = 0;
      store.resources.runnerVY = 0;
      store.resources.scrollOffset = 0;
      store.resources.elapsedMs = 0;
      store.resources.courseLength = courseLength;
      store.resources.finishFlagX = finishFlagX;
      store.resources.parTimeMs = parTimeMs;

      // Clear all entities
      for (const entity of store.select(['platformX'])) store.delete(entity);
      for (const entity of store.select(['obstacleX'])) store.delete(entity);
      for (const entity of store.select(['tokenX'])) store.delete(entity);
    },

    collectToken(store) {
      store.resources.tokensCollected = store.resources.tokensCollected + 1;
    },

    decrementRetry(store) {
      store.resources.retriesRemaining = Math.max(0, store.resources.retriesRemaining - 1);
    },

    triggerWin(store, { parTime, actualTime }: { parTime: number; actualTime: number }) {
      const speedMultiplier = Math.min(Math.max(parTime / Math.max(actualTime, 1), 1.0), 2.0);
      const tokenScore = store.resources.tokensCollected * 10;
      const finalScore = Math.round(tokenScore * speedMultiplier);
      const stars = calcStars(store.resources.tokensCollected, store.resources.tokensTotal);

      store.resources.score = finalScore;
      store.resources.starsEarned = stars;
      store.resources.boardState = BoardState.WON;
    },

    triggerLoss(store) {
      store.resources.boardState = BoardState.FALLING;
      store.resources.retriesRemaining = Math.max(0, store.resources.retriesRemaining - 1);
    },

    updateRunnerPosition(store, { x, y, vY }: { x: number; y: number; vY: number }) {
      store.resources.runnerX = x;
      store.resources.runnerY = y;
      store.resources.runnerVY = vY;
    },

    updateScrollOffset(store, offset: number) {
      store.resources.scrollOffset = offset;
    },

    updateElapsed(store, ms: number) {
      store.resources.elapsedMs = ms;
    },
  },

  actions: {},

  systems: {},
});

export type PlatformRushPlugin = typeof platformRushPlugin;
export type PlatformRushDatabase = Database.FromPlugin<typeof platformRushPlugin>;

// ── ECS → Signals bridge ────────────────────────────────────────────────────

import type { GameState } from '~/game/state';

/**
 * Wires ECS resource observables to SolidJS DOM-bridge signals.
 * Returns a cleanup function to unsubscribe all observers.
 *
 * Each `db.observe.resources.<name>` is an Observe function:
 *   (callback: (value: T) => void) => () => void
 * Calling it subscribes and returns the unsubscribe.
 */
export function bridgeEcsToSignals(
  db: PlatformRushDatabase,
  gs: GameState,
): () => void {
  const unsubs: Array<() => void> = [];

  // Each observe fn: (cb) => unsubscribe
  const sub = <T>(obs: (cb: (v: T) => void) => () => void, setter: (v: T) => void) => {
    unsubs.push(obs(setter));
  };

  sub(db.observe.resources.score, gs.setScore);
  sub(db.observe.resources.starsEarned, gs.setStars);
  sub(db.observe.resources.tokensCollected, gs.setTokensCollected);
  sub(db.observe.resources.tokensTotal, gs.setTokensTotal);
  sub(db.observe.resources.retriesRemaining, gs.setRetriesRemaining);

  return () => unsubs.forEach((u) => u());
}
