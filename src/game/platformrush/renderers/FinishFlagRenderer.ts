/**
 * FinishFlagRenderer — renders the chequered finish flag as '🏁' emoji.
 *
 * Placed at the far-right end of the course, on a Normal platform ≥3 cells wide.
 * No DOM, no requestAnimationFrame.
 */
import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';

export class FinishFlagRenderer {
  readonly container: Container;
  private flagText: Text | null = null;

  constructor() {
    this.container = new Container();
  }

  init(x: number, platformY: number): void {
    if (this.flagText) this.destroy();

    this.flagText = new Text('🏁', { fontSize: 48 } as unknown as never);
    this.flagText.x = x;
    this.flagText.y = platformY - 48; // above platform surface
    this.container.addChild(this.flagText);
  }

  /** Play victory wave animation when runner reaches flag */
  playWin(): void {
    if (!this.flagText) return;
    gsap.to(this.flagText, {
      rotation: 0.3,
      yoyo: true,
      repeat: 3,
      duration: 0.1,
      ease: 'power1.inOut',
      overwrite: 'auto',
    });
  }

  destroy(): void {
    if (this.flagText) {
      gsap.killTweensOf(this.flagText);
      this.container.removeChild(this.flagText);
      this.flagText.destroy();
      this.flagText = null;
    }
  }
}
