/**
 * CourseStartInterstitial — timing and skip
 *
 * Tests auto-advance after 1.5s and tap-to-skip behavior.
 * Uses mocked GSAP to control timing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { gsapMock } = vi.hoisted(() => ({
  gsapMock: {
    to: vi.fn(),
    from: vi.fn(),
    killTweensOf: vi.fn(),
    delayedCall: vi.fn().mockReturnValue({ kill: vi.fn() }),
  },
}));

vi.mock('gsap', () => ({ gsap: gsapMock }));

import { CourseStartInterstitial } from '~/game/platformrush/screens/CourseStartInterstitial';

describe('CourseStartInterstitial — timing and skip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('show() calls gsap.delayedCall with 1.5s for auto-advance', () => {
    const ctrl = new CourseStartInterstitial();
    ctrl.show({ districtIndex: 0, courseIndex: 0, onComplete: vi.fn() });
    expect(gsapMock.delayedCall).toHaveBeenCalledWith(1.5, expect.any(Function));
  });

  it('show() fires onComplete when delayedCall callback runs', () => {
    const onComplete = vi.fn();
    // Make delayedCall immediately invoke the callback
    gsapMock.delayedCall.mockImplementation((_delay: number, fn: () => void) => {
      fn();
      return { kill: vi.fn() };
    });

    const ctrl = new CourseStartInterstitial();
    ctrl.show({ districtIndex: 0, courseIndex: 0, onComplete });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('skip() fires onComplete immediately and cancels auto-advance', () => {
    const onComplete = vi.fn();
    const killFn = vi.fn();
    gsapMock.delayedCall.mockReturnValueOnce({ kill: killFn });

    const ctrl = new CourseStartInterstitial();
    ctrl.show({ districtIndex: 1, courseIndex: 3, onComplete });
    ctrl.skip();

    expect(killFn).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('show() includes district and course info in descriptor', () => {
    const ctrl = new CourseStartInterstitial();
    // districtIndex=1, courseIndex=4 → "District 2 · Course 5 — ..."
    ctrl.show({ districtIndex: 1, courseIndex: 4, onComplete: vi.fn() });

    // The descriptor text should contain the district and course numbers (1-based)
    const descriptor = ctrl.getDescriptor();
    expect(descriptor).toContain('2');
    expect(descriptor).toContain('5');
  });

  it('destroy() kills pending tweens and does not throw', () => {
    const ctrl = new CourseStartInterstitial();
    ctrl.show({ districtIndex: 0, courseIndex: 0, onComplete: vi.fn() });
    expect(() => ctrl.destroy()).not.toThrow();
    expect(gsapMock.killTweensOf).toHaveBeenCalled();
  });
});
