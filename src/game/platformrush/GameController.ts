/**
 * PlatformRush GameController — Pixi-mode game loop.
 *
 * Replaces the DOM-mode stub. Owns:
 *   - Pixi Application lifecycle
 *   - ECS database (source of truth for all state)
 *   - ECS → signal bridge (for DOM screens)
 *   - Layer hierarchy (bg / game / hud / ui)
 *   - RunnerRenderer, InputHandler, physics tick
 *
 * Destroy order: GSAP → Pixi → ECS bridge → setActiveDb(null)
 */
import { Application, Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { createSignal } from 'solid-js';
import { Database } from '@adobe/data/ecs';

import { setActiveDb } from '~/core/systems/ecs';
import { gameState } from '~/game/state';
import type { GameControllerDeps, GameController, SetupGame } from '~/game/mygame-contract';

import { platformRushPlugin, bridgeEcsToSignals } from '~/game/platformrush/PlatformRushPlugin';
import { RunnerRenderer } from '~/game/platformrush/renderers/RunnerRenderer';
import { BackgroundRenderer } from '~/game/platformrush/renderers/BackgroundRenderer';
import { HudRenderer } from '~/game/platformrush/renderers/HudRenderer';
import { InputHandler, type InputHandlerOptions } from '~/game/platformrush/input/InputHandler';
import { BoardState } from '~/game/platformrush/state/types';
import { calcJumpVelocity, tickPhysics, GROUND_Y } from '~/game/platformrush/logic/physics';
import {
  transitionOnTap,
  transitionToLanding,
  transitionToIdle,
} from '~/game/platformrush/logic/stateTransitions';

// ── Factory ──────────────────────────────────────────────────────────────────

export const setupGame: SetupGame = (_deps: GameControllerDeps): GameController => {
  const [ariaText, setAriaText] = createSignal('PlatformRush loading…');

  let app: Application | null = null;
  let ecsDb: ReturnType<typeof Database.create<typeof platformRushPlugin>> | null = null;
  let cleanupBridge: (() => void) | null = null;

  // Layer containers — created once, live for the lifetime of the game
  let bgLayer: Container | null = null;
  let gameLayer: Container | null = null;
  let hudLayer: Container | null = null;
  let uiLayer: Container | null = null;

  let runnerRenderer: RunnerRenderer | null = null;
  let backgroundRenderer: BackgroundRenderer | null = null;
  let hudRenderer: HudRenderer | null = null;
  let inputHandler: InputHandler | null = null;

  // Charge indicator — radial fill shown during hold
  let chargeIndicator: Graphics | null = null;

  const init = (container: HTMLDivElement) => {
    setAriaText('PlatformRush running');

    // ── ECS setup ─────────────────────────────────────────────────────────
    ecsDb = Database.create(platformRushPlugin);
    setActiveDb(ecsDb as unknown as never);
    cleanupBridge = bridgeEcsToSignals(ecsDb, gameState);

    // ── Pixi setup ────────────────────────────────────────────────────────
    app = new Application();

    void app
      .init({
        resizeTo: container,
        background: '#1a1a2e',
        resolution: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
        autoDensity: true,
      })
      .then(() => {
        if (!app || !ecsDb) return;
        container.appendChild(app.canvas as HTMLCanvasElement);

        // ── Stage event mode ────────────────────────────────────────────
        app.stage.eventMode = 'static';

        // ── Layer hierarchy ─────────────────────────────────────────────
        bgLayer = new Container();
        bgLayer.eventMode = 'none';

        gameLayer = new Container();
        gameLayer.eventMode = 'passive';

        hudLayer = new Container();
        hudLayer.eventMode = 'passive';

        uiLayer = new Container();
        uiLayer.eventMode = 'passive';

        app.stage.addChild(bgLayer, gameLayer, hudLayer, uiLayer);

        // ── Background ─────────────────────────────────────────────────
        backgroundRenderer = new BackgroundRenderer();
        backgroundRenderer.init(app.screen.width, app.screen.height);
        bgLayer.addChild(backgroundRenderer.container);

        // ── HUD ────────────────────────────────────────────────────────
        hudRenderer = new HudRenderer();
        hudRenderer.init(app.screen.width, app.screen.height);
        hudLayer.addChild(hudRenderer.container);
        hudRenderer.onPause = () => {
          if (!ecsDb) return;
          ecsDb.transactions.setBoard(BoardState.PAUSED);
        };

        // ── Runner ──────────────────────────────────────────────────────
        runnerRenderer = new RunnerRenderer();
        runnerRenderer.init(app.screen.width, app.screen.height);
        gameLayer.addChild(runnerRenderer.container);

        // ── Charge indicator (radial-fill) ──────────────────────────────
        // Semi-transparent circle beneath runner — GSAP alpha-fills during hold
        chargeIndicator = new Graphics()
          .circle(0, 0, 32)
          .fill({ color: 0x06B6D4, alpha: 0.5 });
        chargeIndicator.x = app.screen.width * 0.25;
        chargeIndicator.y = GROUND_Y;
        chargeIndicator.alpha = 0;
        chargeIndicator.visible = false;
        uiLayer.addChild(chargeIndicator);

        // ── Input handler (wired through existing stage tap handler) ────
        inputHandler = new InputHandler({
          stage: app.stage as unknown as InputHandlerOptions['stage'],
          dispatchTap: (holdMs: number) => {
            if (!ecsDb) return;
            const state = ecsDb.resources.boardState;
            const result = transitionOnTap(state);
            if (result.blocked) return;

            const vy = calcJumpVelocity(holdMs);
            ecsDb.transactions.setBoard(result.nextState);
            ecsDb.transactions.updateRunnerPosition({
              x: ecsDb.resources.runnerX,
              y: ecsDb.resources.runnerY,
              vY: vy,
            });
            runnerRenderer?.syncState(result.nextState);
          },
          getState: () => ecsDb?.resources.boardState ?? BoardState.IDLE,
          chargeIndicator: chargeIndicator as unknown as { alpha: number; visible: boolean },
        });

        // Re-attach properly using the stage
        const onDown = (e: { global?: { y: number } }) => {
          if (!ecsDb) return;
          const state = ecsDb.resources.boardState;
          if (state !== BoardState.IDLE) return;

          const downAt = Date.now();
          if (chargeIndicator) {
            chargeIndicator.visible = true;
            chargeIndicator.alpha = 0;
            gsap.to(chargeIndicator, { alpha: 0.8, duration: 0.5, ease: 'linear', overwrite: 'auto' });
          }

          const onUp = () => {
            const holdMs = Math.min(Date.now() - downAt, 500);
            if (chargeIndicator) {
              gsap.killTweensOf(chargeIndicator);
              chargeIndicator.visible = false;
              chargeIndicator.alpha = 0;
            }

            app?.stage.off('pointerup', onUp);

            if (!ecsDb) return;
            const curState = ecsDb.resources.boardState;
            if (curState !== BoardState.IDLE) return;

            const vy = calcJumpVelocity(holdMs);
            ecsDb.transactions.setBoard(BoardState.AIRBORNE);
            ecsDb.transactions.updateRunnerPosition({
              x: ecsDb.resources.runnerX,
              y: ecsDb.resources.runnerY,
              vY: vy,
            });
            runnerRenderer?.syncState(BoardState.AIRBORNE);
          };

          app?.stage.on('pointerup', onUp);
          void e;
        };

        app.stage.on('pointerdown', onDown);

        // ── Physics game loop (GSAP ticker via Pixi ticker) ─────────────
        app.ticker.add((ticker) => {
          if (!ecsDb) return;

          // Sync HUD with ECS resources every frame
          hudRenderer?.updateScore(ecsDb.resources.score);
          hudRenderer?.updateStars(ecsDb.resources.starsEarned);
          const { finishFlagX, runnerX } = ecsDb.resources;
          if (finishFlagX > 0) {
            hudRenderer?.updateProgress(Math.min(runnerX / finishFlagX, 1));
          }

          // Sync background parallax scroll
          backgroundRenderer?.syncScroll(ecsDb.resources.scrollOffset);

          const { boardState, runnerY, runnerVY } = ecsDb.resources;
          if (boardState !== BoardState.AIRBORNE && boardState !== BoardState.BOUNCING) return;

          const result = tickPhysics(
            { runnerY, runnerVY, boardState, groundY: GROUND_Y },
            ticker.deltaMS,
          );

          ecsDb.transactions.updateRunnerPosition({
            x: ecsDb.resources.runnerX,
            y: result.runnerY,
            vY: result.runnerVY,
          });

          runnerRenderer?.syncPosition(ecsDb.resources.runnerX, result.runnerY);

          if (result.landed) {
            const landing = transitionToLanding(boardState);
            ecsDb.transactions.setBoard(landing.nextState);
            runnerRenderer?.syncState(landing.nextState);

            // Short LANDING → IDLE (2 frames later via GSAP delayedCall)
            gsap.delayedCall(0.032, () => {
              if (!ecsDb) return;
              const idle = transitionToIdle(ecsDb.resources.boardState);
              ecsDb.transactions.setBoard(idle.nextState);
              runnerRenderer?.syncState(idle.nextState);
            });
          }
        });

        // ── Initial ECS state ───────────────────────────────────────────
        ecsDb.transactions.setBoard(BoardState.IDLE);
      })
      .catch((err: unknown) => {
        console.error('[PlatformRush] Pixi init error:', err);
      });
  };

  const destroy = () => {
    setAriaText('PlatformRush stopped');

    // 1. Kill all GSAP tweens first
    if (chargeIndicator) gsap.killTweensOf(chargeIndicator);
    gsap.killTweensOf(runnerRenderer?.container ?? {});

    inputHandler?.detach();
    inputHandler = null;

    if (runnerRenderer) {
      runnerRenderer.destroy();
      runnerRenderer = null;
    }

    if (hudRenderer) {
      hudRenderer.destroy();
      hudRenderer = null;
    }

    if (backgroundRenderer) {
      backgroundRenderer.destroy();
      backgroundRenderer = null;
    }

    if (chargeIndicator) {
      chargeIndicator.destroy();
      chargeIndicator = null;
    }

    // 2. Destroy Pixi application
    if (app) {
      app.destroy(true, { children: true });
      app = null;
    }

    // 3. Tear down ECS bridge
    cleanupBridge?.();
    cleanupBridge = null;

    // 4. Release Inspector reference
    setActiveDb(null);
    ecsDb = null;

    bgLayer = null;
    gameLayer = null;
    hudLayer = null;
    uiLayer = null;
  };

  return {
    gameMode: 'pixi',
    init,
    destroy,
    ariaText,
  };
};
