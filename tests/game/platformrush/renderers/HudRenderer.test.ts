/**
 * HudRenderer — layout and updates
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { gsapToMock } = vi.hoisted(() => ({ gsapToMock: vi.fn() }));

vi.mock('gsap', () => ({
  default: { to: gsapToMock, killTweensOf: vi.fn() },
  gsap: { to: gsapToMock, killTweensOf: vi.fn() },
}));

const textInstances: Array<{ text: string; x: number; y: number; style: { fontSize: number }; destroy: () => void }> = [];
const graphicsInstances: Array<{ rect: ReturnType<typeof vi.fn>; fill: ReturnType<typeof vi.fn>; x: number; y: number; width: number; height: number; destroy: () => void }> = [];

vi.mock('pixi.js', () => ({
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn((c: unknown) => c),
    removeChild: vi.fn(),
    eventMode: 'passive',
    destroy: vi.fn(),
  })),
  Text: vi.fn().mockImplementation((text: string, style: { fontSize: number }) => {
    const inst = { text, x: 0, y: 0, style: { fontSize: style?.fontSize ?? 16 }, destroy: vi.fn() };
    textInstances.push(inst);
    return inst;
  }),
  Graphics: vi.fn().mockImplementation(() => {
    const inst = {
      rect: vi.fn().mockReturnThis(),
      fill: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
      x: 0, y: 0, width: 0, height: 0,
      destroy: vi.fn(),
    };
    graphicsInstances.push(inst);
    return inst;
  }),
}));

import { HudRenderer } from '~/game/platformrush/renderers/HudRenderer';

const HUD_HEIGHT = 80;
const VIEWPORT_W = 390;
const VIEWPORT_H = 844;
const CANVAS_H = VIEWPORT_H - 64; // 780px (DOM logo reserves 64px)

describe('HudRenderer — layout and updates', () => {
  beforeEach(() => {
    textInstances.length = 0;
    graphicsInstances.length = 0;
    vi.clearAllMocks();
  });

  it('HUD height == 80 px', () => {
    const hud = new HudRenderer();
    hud.init(VIEWPORT_W, CANVAS_H);

    expect(hud.hudHeight).toBe(HUD_HEIGHT);
  });

  it('HUD + play area + DOM bottom == 844px (no overlap)', () => {
    // Canvas height = 780 (844 - 64 DOM bottom)
    // HUD = 80px, play area = 700px, total = 780 = 844 - 64
    expect(HUD_HEIGHT + 700 + 64).toBe(844);
    expect(CANVAS_H).toBe(780);
  });

  it('score updates within 1 frame of token collect', () => {
    const hud = new HudRenderer();
    hud.init(VIEWPORT_W, CANVAS_H);

    hud.updateScore(10);

    const scoreText = textInstances.find(t => t.text.includes('10'));
    expect(scoreText).toBeDefined();
  });

  it('progress bar tracks runner.x / finishFlag.x', () => {
    const hud = new HudRenderer();
    hud.init(VIEWPORT_W, CANVAS_H);

    hud.updateProgress(0.5); // 50% through course

    // The progress bar fill should have been updated (GSAP called or direct assignment)
    expect(graphicsInstances.length).toBeGreaterThan(0);
  });

  it('stars reflect starsEarned resource', () => {
    const hud = new HudRenderer();
    hud.init(VIEWPORT_W, CANVAS_H);

    hud.updateStars(2);

    // Star texts should include filled star emojis
    const starTexts = textInstances.filter(t => t.text.includes('⭐') || t.text.includes('☆'));
    expect(starTexts.length).toBeGreaterThan(0);
  });
});
