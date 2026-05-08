/**
 * RunnerRenderer — Pixi renderer for the player character.
 *
 * Uses emoji Text for the runner visual (fallback priority:
 * emoji text > existing sprite with tint > labeled shape).
 *
 * Minimum 48×48 px visible area via fontSize=48.
 * No DOM elements, no requestAnimationFrame.
 * GSAP owns all animation.
 */
import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';
import { BoardState, type BoardState as BoardStateType } from '~/game/platformrush/state/types';

const RUNNER_EMOJI: Record<BoardStateType, string> = {
  [BoardState.IDLE]: '🏃',
  [BoardState.AIRBORNE]: '⬆',
  [BoardState.LANDING]: '⬇',
  [BoardState.BOUNCING]: '⬆',
  [BoardState.WON]: '🏆',
  [BoardState.FALLING]: '💀',
  [BoardState.PAUSED]: '🏃',
};

const FONT_SIZE = 48; // guarantees ≥48×48 px visible area

export class RunnerRenderer {
  readonly container: Container;
  private runnerText: Text;

  constructor() {
    this.container = new Container();
    this.runnerText = new Text(RUNNER_EMOJI[BoardState.IDLE], {
      fontSize: FONT_SIZE,
    } as unknown as never);
  }

  /** Mount into a parent layer. viewportW×viewportH define play-area bounds. */
  init(viewportW: number, viewportH: number): void {
    // Runner sits at ~25% of viewport width, at ground level (80% of viewport height)
    this.runnerText.x = viewportW * 0.25;
    this.runnerText.y = viewportH * 0.8;
    this.container.addChild(this.runnerText);
  }

  /** Sync runner visual to a new board state. Synchronous — no tween needed for text swap. */
  syncState(state: BoardStateType): void {
    this.runnerText.text = RUNNER_EMOJI[state];
  }

  /**
   * Move runner to world position (x, y).
   * Called by GameController each tick with physics output.
   */
  syncPosition(x: number, y: number): void {
    gsap.to(this.runnerText, { x, y, duration: 0, overwrite: 'auto' });
  }

  /** Destroy order: tweens → listeners → removeChild → destroy */
  destroy(): void {
    gsap.killTweensOf(this.runnerText);
    this.container.removeChild(this.runnerText);
    this.runnerText.destroy();
  }
}
