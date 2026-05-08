/**
 * HudRenderer — GPU Pixi overlay in top 80px.
 *
 * Elements (all within y=0..80):
 *   - Score text (right-aligned)
 *   - 3 star indicators (⭐/☆)
 *   - Course progress bar
 *   - Pause button '⏸' (eventMode='static', ≥44×44 px hit area)
 *
 * No DOM, no requestAnimationFrame.
 */
import { Container, Text, Graphics } from 'pixi.js';
import { gsap } from 'gsap';

export const HUD_HEIGHT = 80;

export class HudRenderer {
  readonly container: Container;
  readonly hudHeight = HUD_HEIGHT;

  private scoreText: Text | null = null;
  private starTexts: Text[] = [];
  private progressBar: Graphics | null = null;
  private progressFill: Graphics | null = null;
  private pauseBtn: Text | null = null;
  private viewportW = 390;

  onPause: (() => void) | null = null;

  constructor() {
    this.container = new Container();
  }

  init(viewportW: number, _viewportH: number): void {
    this.viewportW = viewportW;

    // Score text — right side
    this.scoreText = new Text('0', {
      fontSize: 20,
      fill: 0xffffff,
    } as unknown as never);
    this.scoreText.x = viewportW - 60;
    this.scoreText.y = 8;

    // Star indicators — center
    this.starTexts = ['☆', '☆', '☆'].map((emoji, i) => {
      const t = new Text(emoji, { fontSize: 20 } as unknown as never);
      t.x = viewportW / 2 - 36 + i * 28;
      t.y = 8;
      return t;
    });

    // Progress bar track — bottom of HUD
    this.progressBar = new Graphics()
      .rect(8, HUD_HEIGHT - 8, viewportW - 16, 4)
      .fill({ color: 0x444444 });

    this.progressFill = new Graphics()
      .rect(8, HUD_HEIGHT - 8, 0, 4)
      .fill({ color: 0x06B6D4 });

    // Pause button — top left, ≥44×44 px touch target
    this.pauseBtn = new Text('⏸', { fontSize: 24 } as unknown as never);
    this.pauseBtn.x = 8;
    this.pauseBtn.y = 8;
    (this.pauseBtn as unknown as { eventMode: string }).eventMode = 'static';
    this.pauseBtn.on?.('pointertap', () => this.onPause?.());

    this.container.addChild(
      this.progressBar,
      this.progressFill,
      this.scoreText,
      ...this.starTexts,
      this.pauseBtn,
    );
  }

  updateScore(score: number): void {
    if (this.scoreText) this.scoreText.text = String(score);
  }

  /** progress in [0, 1] */
  updateProgress(progress: number): void {
    if (!this.progressFill) return;
    const maxW = this.viewportW - 16;
    gsap.to(this.progressFill, {
      width: maxW * Math.min(progress, 1),
      duration: 0.1,
      overwrite: 'auto',
    });
  }

  updateStars(starsEarned: number): void {
    this.starTexts.forEach((t, i) => {
      t.text = i < starsEarned ? '⭐' : '☆';
    });
  }

  destroy(): void {
    if (this.scoreText) {
      gsap.killTweensOf(this.scoreText);
      this.container.removeChild(this.scoreText);
      this.scoreText.destroy();
      this.scoreText = null;
    }
    for (const t of this.starTexts) {
      this.container.removeChild(t);
      t.destroy();
    }
    this.starTexts = [];
    if (this.progressBar) {
      this.container.removeChild(this.progressBar);
      this.progressBar.destroy();
      this.progressBar = null;
    }
    if (this.progressFill) {
      gsap.killTweensOf(this.progressFill);
      this.container.removeChild(this.progressFill);
      this.progressFill.destroy();
      this.progressFill = null;
    }
    if (this.pauseBtn) {
      this.container.removeChild(this.pauseBtn);
      this.pauseBtn.destroy();
      this.pauseBtn = null;
    }
  }
}
