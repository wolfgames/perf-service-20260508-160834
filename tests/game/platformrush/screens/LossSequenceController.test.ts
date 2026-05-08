/**
 * LossSequenceController — GSAP loss sequence
 *
 * Tests the loss animation sequence: fade-to-dark, token roll-up, retry prompt.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { gsapMock } = vi.hoisted(() => ({
  gsapMock: {
    to: vi.fn(),
    from: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
    })),
    killTweensOf: vi.fn(),
  },
}));

vi.mock('gsap', () => ({ gsap: gsapMock }));
vi.mock('pixi.js', () => ({
  Container: class { addChild = vi.fn(); removeChild = vi.fn(); destroy = vi.fn(); alpha = 1; },
  Text: class { destroy = vi.fn(); text = ''; alpha = 1; },
  Graphics: class { destroy = vi.fn(); rect = vi.fn().mockReturnThis(); fill = vi.fn().mockReturnThis(); alpha = 1; },
}));

import { LossSequenceController } from '~/game/platformrush/screens/LossSequenceController';

describe('LossSequenceController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('play() starts a GSAP timeline', () => {
    const ctrl = new LossSequenceController();
    ctrl.play({ tokensCollected: 2, tokensTotal: 5, retriesRemaining: 1, onComplete: vi.fn() });
    expect(gsapMock.timeline).toHaveBeenCalledTimes(1);
  });

  it('play() calls onComplete when sequence finishes', () => {
    const tl = {
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      call: vi.fn().mockImplementation((fn) => { fn(); return tl; }),
    };
    gsapMock.timeline.mockReturnValueOnce(tl);

    const onComplete = vi.fn();
    const ctrl = new LossSequenceController();
    ctrl.play({ tokensCollected: 2, tokensTotal: 5, retriesRemaining: 0, onComplete });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('destroy() kills all tweens', () => {
    const ctrl = new LossSequenceController();
    ctrl.play({ tokensCollected: 0, tokensTotal: 3, retriesRemaining: 0, onComplete: vi.fn() });
    ctrl.destroy();
    expect(gsapMock.killTweensOf).toHaveBeenCalled();
  });

  it('play() with 0 tokens does not throw', () => {
    const ctrl = new LossSequenceController();
    expect(() =>
      ctrl.play({ tokensCollected: 0, tokensTotal: 0, retriesRemaining: 0, onComplete: vi.fn() })
    ).not.toThrow();
  });

  it('sequence includes at least one tween (fade-to-dark)', () => {
    const ctrl = new LossSequenceController();
    ctrl.play({ tokensCollected: 1, tokensTotal: 4, retriesRemaining: 1, onComplete: vi.fn() });
    const tl = gsapMock.timeline.mock.results[0].value;
    const tweenCalls = tl.to.mock.calls.length;
    expect(tweenCalls).toBeGreaterThanOrEqual(1);
  });
});
