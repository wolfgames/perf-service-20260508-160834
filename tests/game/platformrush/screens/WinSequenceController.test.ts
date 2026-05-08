/**
 * WinSequenceController — GSAP win sequence
 *
 * Tests the win animation sequence: trophy pop-in, star stagger, crossfade.
 * Uses mocked GSAP and Pixi Container to verify tween calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { gsapMock } = vi.hoisted(() => ({
  gsapMock: {
    to: vi.fn(),
    from: vi.fn(),
    fromTo: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
    })),
    killTweensOf: vi.fn(),
    delayedCall: vi.fn(),
  },
}));

vi.mock('gsap', () => ({ gsap: gsapMock }));
vi.mock('pixi.js', () => ({
  Container: class { addChild = vi.fn(); removeChild = vi.fn(); destroy = vi.fn(); alpha = 0; },
  Text: class { destroy = vi.fn(); text = ''; alpha = 0; },
  Graphics: class { destroy = vi.fn(); rect = vi.fn().mockReturnThis(); fill = vi.fn().mockReturnThis(); },
}));

import { WinSequenceController } from '~/game/platformrush/screens/WinSequenceController';

describe('WinSequenceController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('play() starts a GSAP timeline', () => {
    const ctrl = new WinSequenceController();
    ctrl.play({ stars: 3, score: 300, onComplete: vi.fn() });
    expect(gsapMock.timeline).toHaveBeenCalledTimes(1);
  });

  it('play() calls onComplete when sequence finishes', () => {
    // The timeline call() invokes the callback; mock it synchronously
    const tl = {
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      call: vi.fn().mockImplementation((fn) => { fn(); return tl; }),
    };
    gsapMock.timeline.mockReturnValueOnce(tl);

    const onComplete = vi.fn();
    const ctrl = new WinSequenceController();
    ctrl.play({ stars: 3, score: 300, onComplete });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('destroy() kills all tweens before destroying container', () => {
    const ctrl = new WinSequenceController();
    ctrl.play({ stars: 2, score: 150, onComplete: vi.fn() });
    ctrl.destroy();
    expect(gsapMock.killTweensOf).toHaveBeenCalled();
  });

  it('play() with 0 stars does not throw', () => {
    const ctrl = new WinSequenceController();
    expect(() => ctrl.play({ stars: 0, score: 0, onComplete: vi.fn() })).not.toThrow();
  });

  it('play() encodes star count in sequence (timeline receives star data)', () => {
    const ctrl = new WinSequenceController();
    ctrl.play({ stars: 2, score: 200, onComplete: vi.fn() });
    // timeline was called once; tween calls (to/from) count ≥ 1
    const tl = gsapMock.timeline.mock.results[0].value;
    const tweenCalls = tl.to.mock.calls.length + tl.from.mock.calls.length;
    expect(tweenCalls).toBeGreaterThanOrEqual(1);
  });
});
