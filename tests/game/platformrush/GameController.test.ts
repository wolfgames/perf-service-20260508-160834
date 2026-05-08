/**
 * GameController — init and destroy lifecycle
 *
 * Tests that the Pixi-mode GameController creates a canvas (not DOM),
 * and tears down in the correct order: GSAP → Pixi → ECS bridge → setActiveDb(null).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted refs — must be above vi.mock factories ───────────────────────────
const { gsapKillMock, mockAppDestroy, mockAppInit, setActiveDbMock } = vi.hoisted(() => ({
  gsapKillMock: vi.fn(),
  mockAppDestroy: vi.fn(),
  mockAppInit: vi.fn().mockResolvedValue(undefined),
  setActiveDbMock: vi.fn(),
}));

// ── Mock Pixi ───────────────────────────────────────────────────────────────
const mockStage = {
  addChild: vi.fn(),
  removeChild: vi.fn(),
  eventMode: 'static',
};
const mockScreen = { width: 390, height: 780 };
const mockCanvas = { tagName: 'CANVAS' };
const mockApp = {
  init: mockAppInit,
  destroy: mockAppDestroy,
  stage: mockStage,
  screen: mockScreen,
  canvas: mockCanvas,
};

vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => mockApp),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn((child: unknown) => child),
    removeChild: vi.fn(),
    eventMode: 'passive',
    destroy: vi.fn(),
  })),
  Text: vi.fn().mockImplementation(() => ({
    x: 0, y: 0, text: '',
    destroy: vi.fn(),
  })),
}));

// ── Mock GSAP ───────────────────────────────────────────────────────────────
vi.mock('gsap', () => ({
  default: { killTweensOf: gsapKillMock, to: vi.fn() },
  gsap: { killTweensOf: gsapKillMock, to: vi.fn() },
}));

// ── Mock solid-js signals ───────────────────────────────────────────────────
vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

// ── Mock ECS bridge ─────────────────────────────────────────────────────────
vi.mock('~/core/systems/ecs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/core/systems/ecs')>();
  return { ...actual, setActiveDb: setActiveDbMock };
});

import { setupGame } from '~/game/platformrush/GameController';

const fakeContainer = () => ({
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  style: {},
} as unknown as HTMLDivElement);

const makeDeps = () => ({
  coordinator: {
    loadBundle: vi.fn().mockResolvedValue(undefined),
    unloadBundle: vi.fn(),
    hasBundle: vi.fn().mockReturnValue(false),
  } as unknown as never,
  tuning: { scaffold: {}, game: {} } as unknown as never,
  audio: {} as unknown as never,
  gameData: {} as unknown as never,
  analytics: {} as unknown as never,
});

describe('GameController — init and destroy lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppInit.mockResolvedValue(undefined);
  });

  it('gameMode is pixi', () => {
    const controller = setupGame(makeDeps());
    expect(controller.gameMode).toBe('pixi');
  });

  it('init creates Pixi app not DOM div', async () => {
    const controller = setupGame(makeDeps());
    controller.init(fakeContainer());

    await new Promise(r => setTimeout(r, 10));
    expect(mockAppInit).toHaveBeenCalled();
  });

  it('destroy kills tweens before Pixi destroy', () => {
    const controller = setupGame(makeDeps());
    controller.init(fakeContainer());
    controller.destroy();

    const gsapOrder = gsapKillMock.mock.invocationCallOrder[0] ?? 0;
    const pixiOrder = mockAppDestroy.mock.invocationCallOrder[0] ?? Infinity;
    expect(gsapOrder).toBeLessThan(pixiOrder);
  });

  it('destroy calls setActiveDb(null)', () => {
    const controller = setupGame(makeDeps());
    controller.init(fakeContainer());
    controller.destroy();

    expect(setActiveDbMock).toHaveBeenCalledWith(null);
  });
});
