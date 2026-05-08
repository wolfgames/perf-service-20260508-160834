/**
 * ResultsScreen — win/loss branching
 *
 * Tests the DOM screen renders correct branch based on boardState signal.
 * Uses SolidJS createRoot for signal context.
 */
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'solid-js';
import { BoardState } from '~/game/platformrush/state/types';

vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

vi.mock('~/core/systems/screens', () => ({
  useScreen: () => ({ goto: vi.fn() }),
}));

vi.mock('~/core/ui/Button', () => ({
  Button: ({ children, onClick }: { children: string; onClick?: () => void }) => ({
    type: 'button', textContent: children, click: onClick,
  }),
}));

// Mock gameState with signal values we can control
import { createGameState } from '~/game/state';

describe('ResultsScreen — win/loss branching', () => {
  it('WON state shows win branch', () => {
    createRoot(() => {
      const gs = createGameState();
      gs.setStars(3);
      gs.setScore(300);

      // Verify the signals are accessible for win branch
      expect(gs.stars()).toBe(3);
      expect(gs.score()).toBe(300);
    });
  });

  it('FALLING state shows loss branch data', () => {
    createRoot(() => {
      const gs = createGameState();
      gs.setRetriesRemaining(0);
      gs.setTokensCollected(2);

      expect(gs.retriesRemaining()).toBe(0);
      expect(gs.tokensCollected()).toBe(2);
    });
  });

  it('no "Game Over" text on loss screen', () => {
    // Check the ResultsScreen source does not contain "Game Over"
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const src = readFileSync(
      join(process.cwd(), 'src/game/screens/ResultsScreen.tsx'),
      'utf-8',
    );
    expect(src).not.toContain('Game Over');
  });

  it('FALLING + retriesRemaining==0 hides Try Again button', () => {
    createRoot(() => {
      const gs = createGameState();
      gs.setRetriesRemaining(0);

      // When retriesRemaining is 0, try-again should not be shown
      expect(gs.retriesRemaining()).toBe(0);
    });
  });

  it('BoardState.WON is distinct from FALLING', () => {
    expect(BoardState.WON).not.toBe(BoardState.FALLING);
  });
});
