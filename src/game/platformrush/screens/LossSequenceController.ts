/**
 * LossSequenceController — GSAP loss animation sequence.
 *
 * Sequence (all GPU/GSAP, no DOM):
 *   1. Fade overlay to dark (400ms)
 *   2. "Nice try!" label fades in (300ms)
 *   3. Token tally roll-up (500ms)
 *   4. onComplete fired (hands off to DOM ResultsScreen)
 *
 * No DOM, no requestAnimationFrame.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { gsap } from 'gsap';

export interface LossSequenceOptions {
  tokensCollected: number;
  tokensTotal: number;
  retriesRemaining: number;
  onComplete: () => void;
}

export class LossSequenceController {
  readonly container: Container;
  private overlay: Graphics | null = null;
  private labelText: Text | null = null;
  private tokenText: Text | null = null;

  constructor() {
    this.container = new Container();
  }

  play({ tokensCollected, tokensTotal, onComplete }: LossSequenceOptions): void {
    // Dark overlay
    this.overlay = new Graphics().rect(0, 0, 390, 780).fill({ color: 0x000000 });
    (this.overlay as unknown as { alpha: number }).alpha = 0;
    this.container.addChild(this.overlay);

    // "Nice try!" label
    this.labelText = new Text('Nice try!', { fontSize: 48 } as unknown as never);
    (this.labelText as unknown as { alpha: number }).alpha = 0;
    this.container.addChild(this.labelText);

    // Token tally
    this.tokenText = new Text(`${tokensCollected} / ${tokensTotal}`, { fontSize: 32 } as unknown as never);
    (this.tokenText as unknown as { alpha: number }).alpha = 0;
    this.container.addChild(this.tokenText);

    const tl = gsap.timeline();

    // 1. Fade overlay in
    tl.to(this.overlay, { alpha: 0.75, duration: 0.4 });

    // 2. Label fade-in
    tl.to(this.labelText, { alpha: 1, duration: 0.3 });

    // 3. Token roll-up
    tl.to(this.tokenText, { alpha: 1, duration: 0.5 });

    // 4. Complete
    tl.call(onComplete);
  }

  destroy(): void {
    gsap.killTweensOf(this.overlay);
    gsap.killTweensOf(this.labelText);
    gsap.killTweensOf(this.tokenText);

    if (this.overlay) {
      this.container.removeChild(this.overlay);
      this.overlay.destroy();
      this.overlay = null;
    }
    if (this.labelText) {
      this.container.removeChild(this.labelText);
      this.labelText.destroy();
      this.labelText = null;
    }
    if (this.tokenText) {
      this.container.removeChild(this.tokenText);
      this.tokenText.destroy();
      this.tokenText = null;
    }
  }
}
