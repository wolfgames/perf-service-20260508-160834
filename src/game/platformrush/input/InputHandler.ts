/**
 * PlatformRush InputHandler — tap/hold pointer input.
 *
 * Attaches to a Pixi Container stage (not the DOM).
 * Tap ≤ 150 ms → short hop. Hold 150–500 ms → scaled leap.
 * Hold > 500 ms → clamped at 500 ms behavior.
 *
 * Radial-fill charge indicator shown via GSAP during hold.
 * Input blocked when not in IDLE state.
 *
 * No DOM, no requestAnimationFrame, no Math.random.
 */
import { gsap } from 'gsap';
import { canAcceptInput } from '~/game/platformrush/logic/stateTransitions';
import type { BoardState } from '~/game/platformrush/state/types';

const TAP_THRESHOLD_MS = 150;
const MAX_HOLD_MS = 500;

type Stage = {
  on: (event: string, fn: (e: PointerEventLike) => void) => void;
  off: (event: string, fn: (e: PointerEventLike) => void) => void;
};

interface PointerEventLike {
  global?: { y: number };
}

interface ChargeIndicator {
  alpha: number;
  visible: boolean;
}

export interface InputHandlerOptions {
  stage: Stage;
  /** Called with holdMs (0–500) when a jump should be dispatched */
  dispatchTap: (holdMs: number) => void;
  /** Returns current board state — used to gate input */
  getState: () => BoardState;
  /** Pixi Container shown as radial-fill charge indicator during hold */
  chargeIndicator: ChargeIndicator;
}

export class InputHandler {
  private readonly opts: InputHandlerOptions;
  private downAt = 0;
  private chargeTween: gsap.core.Tween | null = null;
  private readonly onDown: (e: PointerEventLike) => void;
  private readonly onUp: () => void;

  constructor(opts: InputHandlerOptions) {
    this.opts = opts;

    this.onDown = (e: PointerEventLike) => {
      if (!canAcceptInput(this.opts.getState())) return;

      this.downAt = Date.now();

      // Start radial-fill GSAP tween as feedback during hold
      const { chargeIndicator } = this.opts;
      chargeIndicator.visible = true;
      chargeIndicator.alpha = 0;
      this.chargeTween = gsap.to(chargeIndicator, {
        alpha: 1,
        duration: MAX_HOLD_MS / 1000,
        ease: 'linear',
        overwrite: 'auto',
      });

      void e; // touch position unused in this pass (full-screen jump zone)
    };

    this.onUp = () => {
      if (this.downAt === 0) return; // no matching down event

      const holdMs = Math.min(Date.now() - this.downAt, MAX_HOLD_MS);
      this.downAt = 0;

      // Kill charge tween and hide indicator
      if (this.chargeTween) {
        gsap.killTweensOf(this.opts.chargeIndicator);
        this.chargeTween = null;
      }
      this.opts.chargeIndicator.visible = false;
      this.opts.chargeIndicator.alpha = 0;

      // Only dispatch if still in an acceptable state
      if (!canAcceptInput(this.opts.getState())) return;

      this.opts.dispatchTap(holdMs);
    };
  }

  attach(): void {
    this.opts.stage.on('pointerdown', this.onDown);
    this.opts.stage.on('pointerup', this.onUp);
  }

  detach(): void {
    this.opts.stage.off('pointerdown', this.onDown);
    this.opts.stage.off('pointerup', this.onUp);
    if (this.chargeTween) {
      gsap.killTweensOf(this.opts.chargeIndicator);
      this.chargeTween = null;
    }
    this.downAt = 0;
  }
}
