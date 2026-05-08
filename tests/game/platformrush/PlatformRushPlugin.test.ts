/**
 * PlatformRushPlugin — ECS resources and transactions
 *
 * Tests the ECS plugin's initial state and core transactions.
 * All game state lives in ECS; signals are a DOM bridge only.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Database } from '@adobe/data/ecs';

// Mocked before import to avoid DOM/signal initialisation in node
vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

import { platformRushPlugin } from '~/game/platformrush/PlatformRushPlugin';
import { BoardState } from '~/game/platformrush/state/types';

function createDb() {
  return Database.create(platformRushPlugin);
}

describe('PlatformRushPlugin — ECS resources and transactions', () => {
  it('all resources have correct initial values', () => {
    const db = createDb();
    const r = db.store.resources;

    expect(r.score).toBe(0);
    expect(r.starsEarned).toBe(0);
    expect(r.tokensCollected).toBe(0);
    expect(r.tokensTotal).toBe(0);
    expect(r.retriesRemaining).toBe(1);
    expect(r.districtIndex).toBe(0);
    expect(r.courseIndex).toBe(0);
    expect(r.boardState).toBe(BoardState.IDLE);
    expect(r.runnerX).toBe(0);
    expect(r.runnerY).toBe(0);
    expect(r.runnerVY).toBe(0);
    expect(r.scrollOffset).toBe(0);
  });

  it('addScore transaction increments score resource', () => {
    const db = createDb();

    db.transactions.addScore(10);
    expect(db.store.resources.score).toBe(10);

    db.transactions.addScore(25);
    expect(db.store.resources.score).toBe(35);
  });

  it('setBoard transaction changes boardState resource', () => {
    const db = createDb();

    db.transactions.setBoard(BoardState.AIRBORNE);
    expect(db.store.resources.boardState).toBe(BoardState.AIRBORNE);
  });

  it('collectToken increments tokensCollected', () => {
    const db = createDb();
    db.transactions.replaceLevel({ tokensTotal: 5 });

    db.transactions.collectToken();
    expect(db.store.resources.tokensCollected).toBe(1);
  });

  it('decrementRetry decrements retriesRemaining (floor 0)', () => {
    const db = createDb();
    expect(db.store.resources.retriesRemaining).toBe(1);

    db.transactions.decrementRetry();
    expect(db.store.resources.retriesRemaining).toBe(0);

    db.transactions.decrementRetry();
    expect(db.store.resources.retriesRemaining).toBe(0); // floor at 0
  });

  it('triggerWin writes starsEarned based on tokensCollected / tokensTotal', () => {
    const db = createDb();
    db.transactions.replaceLevel({ tokensTotal: 10 });
    // collect 9 tokens (90% → 3 stars)
    for (let i = 0; i < 9; i++) db.transactions.collectToken();

    db.transactions.triggerWin({ parTime: 1000, actualTime: 1000 });

    expect(db.store.resources.starsEarned).toBe(3);
    expect(db.store.resources.boardState).toBe(BoardState.WON);
  });

  it('triggerLoss sets boardState to FALLING and decrements retriesRemaining', () => {
    const db = createDb();

    db.transactions.triggerLoss();

    expect(db.store.resources.boardState).toBe(BoardState.FALLING);
    expect(db.store.resources.retriesRemaining).toBe(0);
  });

  it('score starts at 0 and tokensTotal is settable from level config', () => {
    const db = createDb();
    expect(db.store.resources.score).toBe(0);

    db.transactions.replaceLevel({ tokensTotal: 12 });
    expect(db.store.resources.tokensTotal).toBe(12);
  });
});

describe('PlatformRushPlugin — bridgeEcsToSignals propagation', () => {
  it('bridgeEcsToSignals propagates score to DOM signal', async () => {
    // Dynamic import to avoid module-level side effects
    const { createGameState } = await import('~/game/state');
    const { bridgeEcsToSignals } = await import('~/game/platformrush/PlatformRushPlugin');

    const gs = createGameState();
    const db = createDb();
    const cleanup = bridgeEcsToSignals(db, gs);

    db.transactions.addScore(42);

    // Observe is synchronous for resource changes
    expect(gs.score()).toBe(42);

    cleanup();
  });
});
