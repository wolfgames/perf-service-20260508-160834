/**
 * DistrictCompleteOverlay — trigger and navigation
 *
 * Tests the overlay shown after all 8 courses in a district complete.
 * Next District button unlocks next district's course-0.
 */
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'solid-js';

vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

vi.mock('~/core/systems/screens', () => ({
  useScreen: () => ({ goto: vi.fn() }),
}));

import {
  createProgressionStore,
  isDistrictComplete,
  unlockNextDistrict,
} from '~/game/platformrush/screens/progressionStore';

describe('DistrictCompleteOverlay — trigger and navigation', () => {
  it('isDistrictComplete returns false when no courses are complete', () => {
    createRoot(() => {
      const store = createProgressionStore();
      expect(isDistrictComplete(store, 0)).toBe(false);
    });
  });

  it('isDistrictComplete returns true when all 8 courses of district are complete', () => {
    createRoot(() => {
      const store = createProgressionStore();
      for (let c = 0; c < 8; c++) {
        store.markComplete(0, c, 1);
      }
      expect(isDistrictComplete(store, 0)).toBe(true);
    });
  });

  it('unlockNextDistrict unlocks district-1/course-0 after district-0 complete', () => {
    createRoot(() => {
      const store = createProgressionStore();
      for (let c = 0; c < 8; c++) {
        store.markComplete(0, c, 1);
      }
      unlockNextDistrict(store, 0);
      // district-1/course-0 should now be accessible
      const node = store.districts[1]?.[0];
      expect(node?.status).toBe('unlocked');
    });
  });

  it('unlockNextDistrict does not throw for last district (no overflow)', () => {
    createRoot(() => {
      const store = createProgressionStore();
      expect(() => unlockNextDistrict(store, 2)).not.toThrow();
    });
  });
});
