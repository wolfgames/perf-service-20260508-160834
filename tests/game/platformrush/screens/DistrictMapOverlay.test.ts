/**
 * DistrictMapOverlay — lock/unlock state
 *
 * Tests district map overlay with course node states: locked, unlocked, complete.
 * Uses in-memory progression store (no persistence).
 */
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'solid-js';

vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

const { gsapMock } = vi.hoisted(() => ({
  gsapMock: {
    to: vi.fn(),
    killTweensOf: vi.fn(),
  },
}));

vi.mock('gsap', () => ({ gsap: gsapMock }));

import {
  createProgressionStore,
  canStartCourse,
  getNodeState,
  unlockCourse,
} from '~/game/platformrush/screens/progressionStore';

describe('DistrictMapOverlay — lock/unlock state', () => {
  it('initial state: only district-0 course-0 is unlocked', () => {
    createRoot(() => {
      const store = createProgressionStore();
      // Only d0/c0 is accessible at start
      expect(canStartCourse(store, 0, 0)).toBe(true);
      // d0/c1 is locked initially
      expect(canStartCourse(store, 0, 1)).toBe(false);
      // d1/c0 is locked
      expect(canStartCourse(store, 1, 0)).toBe(false);
    });
  });

  it('completed node shows star count', () => {
    createRoot(() => {
      const store = createProgressionStore();
      // Mark d0/c0 complete with 2 stars
      store.markComplete(0, 0, 2);
      const state = getNodeState(store, 0, 0);
      expect(state.status).toBe('complete');
      expect(state.stars).toBe(2);
    });
  });

  it('completing a course unlocks the next course', () => {
    createRoot(() => {
      const store = createProgressionStore();
      store.markComplete(0, 0, 3);
      expect(canStartCourse(store, 0, 1)).toBe(true);
    });
  });

  it('locked node state is "locked"', () => {
    createRoot(() => {
      const store = createProgressionStore();
      const state = getNodeState(store, 0, 2);
      expect(state.status).toBe('locked');
    });
  });

  it('page reload resets to only district-0/course-0 unlocked (in-memory default)', () => {
    createRoot(() => {
      const store = createProgressionStore();
      // Fresh store = only d0/c0 unlocked
      expect(canStartCourse(store, 0, 0)).toBe(true);
      expect(canStartCourse(store, 0, 1)).toBe(false);
    });
  });

  it('unlockCourse explicitly unlocks a node', () => {
    createRoot(() => {
      const store = createProgressionStore();
      unlockCourse(store, 1, 0);
      expect(canStartCourse(store, 1, 0)).toBe(true);
    });
  });
});
