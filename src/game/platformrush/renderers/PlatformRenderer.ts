/**
 * PlatformRenderer — renders platform entities as labeled emoji text.
 *
 * Fallback priority: emoji text > labeled shape.
 * Normal='⬛', Crumbling='🟧', Bouncy='🟩'
 * Crumble animation: GSAP alpha+shake 300ms on crumble-start event.
 * Bounce animation: GSAP scale pulse 150ms on bounce-launch event.
 *
 * No DOM, no requestAnimationFrame.
 */
import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';
import type { Platform } from '~/game/platformrush/logic/platformLogic';

const PLATFORM_EMOJI: Record<Platform['type'], string> = {
  normal: '⬛',
  crumbling: '🟧',
  bouncy: '🟩',
};

const FONT_SIZE = 24;

interface PlatformVisual {
  text: Text;
  platform: Platform;
}

export class PlatformRenderer {
  readonly container: Container;
  private visuals: PlatformVisual[] = [];

  constructor() {
    this.container = new Container();
  }

  init(platforms: Platform[]): void {
    this.clearAll();

    for (const platform of platforms) {
      // Render one emoji per cell to fill the platform width
      const cells = Math.max(1, Math.floor(platform.width / 64));
      for (let c = 0; c < cells; c++) {
        const text = new Text(PLATFORM_EMOJI[platform.type], {
          fontSize: FONT_SIZE,
        } as unknown as never);
        text.x = platform.x + c * 64;
        text.y = platform.y;
        this.container.addChild(text);
        if (c === 0) {
          // Only track the first cell for animations
          this.visuals.push({ text, platform });
        }
      }
    }
  }

  /** Called when a crumble-start event fires for a platform at given x */
  playCrumble(platformX: number): void {
    const visual = this.visuals.find(v => v.platform.x === platformX);
    if (!visual) return;

    // Shake + fade over 300ms
    gsap.to(visual.text, {
      alpha: 0,
      duration: 0.3,
      ease: 'power2.in',
      overwrite: 'auto',
    });
    gsap.to(visual.text, {
      x: visual.text.x + 4,
      yoyo: true,
      repeat: 3,
      duration: 0.05,
      ease: 'power1.inOut',
    });
  }

  /** Called when a bounce-launch event fires */
  playBounce(platformX: number): void {
    const visual = this.visuals.find(v => v.platform.x === platformX);
    if (!visual) return;

    gsap.to(visual.text.scale, {
      x: 1.2,
      y: 0.8,
      duration: 0.075,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut',
      overwrite: 'auto',
    });
  }

  private clearAll(): void {
    for (const { text } of this.visuals) {
      gsap.killTweensOf(text);
      this.container.removeChild(text);
      text.destroy();
    }
    this.visuals = [];
  }

  destroy(): void {
    this.clearAll();
  }
}
