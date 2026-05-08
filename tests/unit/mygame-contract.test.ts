/**
 * mygame contract validation.
 *
 * Ensures the mygame module exports functions that satisfy
 * the contract types required by the scaffold screens.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@wolfgames/components/solid', () => ({
  Spinner: () => null,
  ProgressBar: () => null,
  useSignal: (s: { get: () => unknown }) => s.get,
}));

vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

// pixi.js performs a top-level navigator check when imported in Node; mock it
// so that mygame/index.ts (which re-exports the Pixi GameController) can be
// imported without crashing in the unit test environment.
vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    stage: { addChild: vi.fn(), removeChild: vi.fn(), eventMode: 'static' },
    screen: { width: 390, height: 780 },
    canvas: { tagName: 'CANVAS' },
    ticker: { add: vi.fn(), remove: vi.fn() },
  })),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn((c: unknown) => c),
    removeChild: vi.fn(),
    eventMode: 'passive',
    destroy: vi.fn(),
  })),
  Text: vi.fn().mockImplementation(() => ({ x: 0, y: 0, text: '', destroy: vi.fn() })),
  Graphics: vi.fn().mockImplementation(() => ({
    rect: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  })),
}));

import { setupGame, setupStartScreen } from '~/game/mygame';
import type { SetupGame, SetupStartScreen } from '~/game/mygame-contract';

describe('mygame contract', () => {
  it('exports setupGame matching SetupGame signature', () => {
    expect(typeof setupGame).toBe('function');

    const _typeCheck: SetupGame = setupGame;
    expect(_typeCheck).toBe(setupGame);
  });

  it('exports setupStartScreen matching SetupStartScreen signature', () => {
    expect(typeof setupStartScreen).toBe('function');

    const _typeCheck: SetupStartScreen = setupStartScreen;
    expect(_typeCheck).toBe(setupStartScreen);
  });
});
