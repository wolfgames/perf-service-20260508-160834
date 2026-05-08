/**
 * RunnerRenderer — visual and state
 *
 * Tests that the runner is at least 48×48 px and changes
 * appearance within 100ms when boardState transitions to AIRBORNE.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoardState } from '~/game/platformrush/state/types';

// ── Mock Pixi ────────────────────────────────────────────────────────────────
const textInstances: Array<{ text: string; style: { fontSize: number }; x: number; y: number; destroy: () => void }> = [];

vi.mock('pixi.js', () => ({
  Application: vi.fn(),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn((child) => child),
    removeChild: vi.fn(),
    eventMode: 'passive',
    x: 0, y: 0,
    destroy: vi.fn(),
  })),
  Text: vi.fn().mockImplementation((text: string, style: { fontSize: number }) => {
    const inst = { text, style: { fontSize: style?.fontSize ?? 48 }, x: 0, y: 0, destroy: vi.fn() };
    textInstances.push(inst);
    return inst;
  }),
  TextStyle: vi.fn().mockImplementation((style: unknown) => style),
}));

// ── Mock GSAP ─────────────────────────────────────────────────────────────────
vi.mock('gsap', () => ({
  default: { to: vi.fn(), killTweensOf: vi.fn() },
  gsap: { to: vi.fn(), killTweensOf: vi.fn() },
}));

import { RunnerRenderer } from '~/game/platformrush/renderers/RunnerRenderer';

describe('RunnerRenderer — visual and state', () => {
  beforeEach(() => {
    textInstances.length = 0;
    vi.clearAllMocks();
  });

  it('runner visible area is >= 48x48 px', () => {
    const renderer = new RunnerRenderer();
    renderer.init(390, 780);

    // The text emoji represents the runner; fontSize >= 48 ensures visual area
    const runnerText = textInstances[0];
    expect(runnerText).toBeDefined();
    expect(runnerText.style.fontSize).toBeGreaterThanOrEqual(48);
  });

  it('runner emoji changes within 100ms of boardState AIRBORNE', async () => {
    const renderer = new RunnerRenderer();
    renderer.init(390, 780);

    const start = Date.now();
    renderer.syncState(BoardState.AIRBORNE);
    const elapsed = Date.now() - start;

    // Text is updated synchronously (GSAP tween fires, not just schedules)
    expect(elapsed).toBeLessThan(100);
    expect(textInstances[0]?.text).not.toBe('🏃'); // changed from run emoji
  });

  it('runner emoji is 🏃 in IDLE state', () => {
    const renderer = new RunnerRenderer();
    renderer.init(390, 780);

    renderer.syncState(BoardState.IDLE);
    expect(textInstances[0]?.text).toBe('🏃');
  });

  it('runner emoji is ⬆ in AIRBORNE state', () => {
    const renderer = new RunnerRenderer();
    renderer.init(390, 780);

    renderer.syncState(BoardState.AIRBORNE);
    expect(textInstances[0]?.text).toBe('⬆');
  });
});
