/**
 * InputHandler — pointer event dispatch
 *
 * Tests tap-hold input processing with fake pointer events.
 * Verifies timing thresholds, radial-fill appearance, and AIRBORNE blocking.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoardState } from '~/game/platformrush/state/types';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { gsapToMock, gsapKillMock } = vi.hoisted(() => ({
  gsapToMock: vi.fn(),
  gsapKillMock: vi.fn(),
}));

vi.mock('gsap', () => ({
  default: { to: gsapToMock, killTweensOf: gsapKillMock },
  gsap: { to: gsapToMock, killTweensOf: gsapKillMock },
}));

// Fake Pixi stage with pointer event simulation
const makeStage = () => {
  const handlers: Record<string, ((e: unknown) => void)[]> = {};
  return {
    on: vi.fn((event: string, fn: (e: unknown) => void) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(fn);
    }),
    off: vi.fn(),
    emit: (event: string, data: unknown) => {
      handlers[event]?.forEach(fn => fn(data));
    },
    addChild: vi.fn(),
  };
};

import { InputHandler } from '~/game/platformrush/input/InputHandler';

describe('InputHandler — pointer event dispatch', () => {
  let stage: ReturnType<typeof makeStage>;
  let dispatchMock: ReturnType<typeof vi.fn>;
  let getStateMock: ReturnType<typeof vi.fn>;
  let chargeIndicator: { alpha: number; visible: boolean };

  beforeEach(() => {
    vi.clearAllMocks();
    stage = makeStage();
    dispatchMock = vi.fn();
    getStateMock = vi.fn().mockReturnValue(BoardState.IDLE);
    chargeIndicator = { alpha: 0, visible: false };
  });

  it('tap <= 150ms dispatches short-hop', () => {
    vi.useFakeTimers();
    const handler = new InputHandler({
      stage: stage as unknown as never,
      dispatchTap: dispatchMock,
      getState: getStateMock,
      chargeIndicator: chargeIndicator as unknown as never,
    });

    handler.attach();
    stage.emit('pointerdown', { global: { y: 600 } });
    vi.advanceTimersByTime(100); // tap = 100 ms < 150 ms threshold
    stage.emit('pointerup', {});

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const [holdMs] = dispatchMock.mock.calls[0] as [number];
    expect(holdMs).toBeLessThanOrEqual(150);

    vi.useRealTimers();
    handler.detach();
  });

  it('hold 300ms dispatches scaled leap', () => {
    vi.useFakeTimers();
    const handler = new InputHandler({
      stage: stage as unknown as never,
      dispatchTap: dispatchMock,
      getState: getStateMock,
      chargeIndicator: chargeIndicator as unknown as never,
    });

    handler.attach();
    stage.emit('pointerdown', { global: { y: 600 } });
    vi.advanceTimersByTime(300);
    stage.emit('pointerup', {});

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const [holdMs] = dispatchMock.mock.calls[0] as [number];
    expect(holdMs).toBeGreaterThan(150);
    expect(holdMs).toBeLessThanOrEqual(500);

    vi.useRealTimers();
    handler.detach();
  });

  it('input blocked in AIRBORNE', () => {
    vi.useFakeTimers();
    getStateMock.mockReturnValue(BoardState.AIRBORNE);
    const handler = new InputHandler({
      stage: stage as unknown as never,
      dispatchTap: dispatchMock,
      getState: getStateMock,
      chargeIndicator: chargeIndicator as unknown as never,
    });

    handler.attach();
    stage.emit('pointerdown', { global: { y: 600 } });
    vi.advanceTimersByTime(100);
    stage.emit('pointerup', {});

    expect(dispatchMock).not.toHaveBeenCalled();

    vi.useRealTimers();
    handler.detach();
  });

  it('radial fill shown during hold via GSAP', () => {
    vi.useFakeTimers();
    const handler = new InputHandler({
      stage: stage as unknown as never,
      dispatchTap: dispatchMock,
      getState: getStateMock,
      chargeIndicator: chargeIndicator as unknown as never,
    });

    handler.attach();
    stage.emit('pointerdown', { global: { y: 600 } });

    // GSAP tween called to animate radial fill
    expect(gsapToMock).toHaveBeenCalled();

    vi.useRealTimers();
    handler.detach();
  });
});
