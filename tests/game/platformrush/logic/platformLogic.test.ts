/**
 * platform logic — types and behaviors
 *
 * Pure logic tests — no Pixi, no Math.random.
 */
import { describe, it, expect } from 'vitest';
import {
  checkRunnerOnPlatform,
  triggerCrumble,
  triggerBounce,
  CRUMBLE_DELAY_MS,
  BOUNCE_MULTIPLIER,
} from '~/game/platformrush/logic/platformLogic';
import { SHORT_HOP_APEX, GRAVITY } from '~/game/platformrush/logic/physics';

describe('platform logic — types and behaviors', () => {
  it('Normal platform supports runner (runner on platform returns true)', () => {
    const platform = { x: 0, y: 500, width: 192, type: 'normal' as const };
    const runner = { x: 96, y: 500 };

    expect(checkRunnerOnPlatform(runner, platform)).toBe(true);
  });

  it('runner not overlapping platform returns false', () => {
    const platform = { x: 0, y: 500, width: 192, type: 'normal' as const };
    const runner = { x: 300, y: 500 };

    expect(checkRunnerOnPlatform(runner, platform)).toBe(false);
  });

  it('Crumbling emits crumble-start at contact, crumble-complete at 500ms', () => {
    const result = triggerCrumble();
    expect(result.events.some(e => e.type === 'crumble-start')).toBe(true);
    expect(result.crumbleCompleteMs).toBe(CRUMBLE_DELAY_MS);
  });

  it('crumble animation duration is 300ms', () => {
    const result = triggerCrumble();
    const animEvent = result.events.find(e => e.type === 'crumble-start');
    expect(animEvent?.animDuration).toBe(300);
  });

  it('Bouncy launches at 1.8x short hop apex', () => {
    const result = triggerBounce();
    expect(result.bouncyVY).toBeDefined();
    // The apex from bounce should be ~1.8× SHORT_HOP_APEX
    // Using v² = 2gh → v = sqrt(2 * g * apex)
    const expectedApex = SHORT_HOP_APEX * BOUNCE_MULTIPLIER;
    const expectedVY = -Math.sqrt(2 * GRAVITY * expectedApex);
    expect(result.bouncyVY).toBeCloseTo(expectedVY, 1);
  });

  it('bounce launch event emitted', () => {
    const result = triggerBounce();
    expect(result.events.some(e => e.type === 'bounce-launch')).toBe(true);
  });
});
