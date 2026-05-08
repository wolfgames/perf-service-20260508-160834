/**
 * WinSequenceController — GSAP win animation sequence.
 *
 * Sequence (all GPU/GSAP, no DOM):
 *   1. Trophy pop-in (scale 0→1, 400ms, back.out ease)
 *   2. Score count-up text (300ms)
 *   3. Star icons stagger in (100ms each, stagger 120ms)
 *   4. onComplete fired
 *
 * Caller is responsible for mounting the container in the Pixi scene.
 * No DOM, no requestAnimationFrame.
 */
import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';

export interface WinSequenceOptions {
  stars: number;
  score: number;
  onComplete: () => void;
}

export class WinSequenceController {
  readonly container: Container;
  private trophyText: Text | null = null;
  private scoreText: Text | null = null;
  private starTexts: Text[] = [];

  constructor() {
    this.container = new Container();
  }

  play({ stars, score, onComplete }: WinSequenceOptions): void {
    // Trophy emoji
    this.trophyText = new Text('🏆', { fontSize: 72 } as unknown as never);
    this.trophyText.alpha = 0;
    this.container.addChild(this.trophyText);

    // Score text
    this.scoreText = new Text(`${score}`, { fontSize: 40 } as unknown as never);
    this.scoreText.alpha = 0;
    this.container.addChild(this.scoreText);

    // Star texts
    this.starTexts = Array.from({ length: 3 }).map((_, i) => {
      const t = new Text(i < stars ? '⭐' : '☆', { fontSize: 36 } as unknown as never);
      t.alpha = 0;
      this.container.addChild(t);
      return t;
    });

    const tl = gsap.timeline();

    // 1. Trophy pop-in
    tl.from(this.trophyText, {
      pixi: { scale: 0 },
      alpha: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
    });

    // 2. Score fade-in
    tl.to(this.scoreText, { alpha: 1, duration: 0.3 });

    // 3. Stars stagger in
    for (const starText of this.starTexts) {
      tl.to(starText, { alpha: 1, duration: 0.1 }, '+=0.12');
    }

    // 4. Complete
    tl.call(onComplete);
  }

  destroy(): void {
    gsap.killTweensOf(this.trophyText);
    gsap.killTweensOf(this.scoreText);
    for (const t of this.starTexts) {
      gsap.killTweensOf(t);
      this.container.removeChild(t);
      t.destroy();
    }
    this.starTexts = [];

    if (this.trophyText) {
      this.container.removeChild(this.trophyText);
      this.trophyText.destroy();
      this.trophyText = null;
    }
    if (this.scoreText) {
      this.container.removeChild(this.scoreText);
      this.scoreText.destroy();
      this.scoreText = null;
    }
  }
}
