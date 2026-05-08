/**
 * BackgroundRenderer — 2-layer parallax neon cityscape.
 *
 * Far skyline: purple tint '🌆' at 0.3× scroll speed
 * Near rooftops: cyan tint at 0.7× scroll speed
 *
 * Neon palette: purple #8B5CF6, cyan #06B6D4, amber #F59E0B
 * All emoji text — no unlabeled Graphics shapes.
 *
 * No DOM, no requestAnimationFrame.
 */
import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';

const NEON_PURPLE = 0x8B5CF6;
const NEON_CYAN = 0x06B6D4;

export class BackgroundRenderer {
  readonly container: Container;
  private skylineLayer: Container;
  private rooftopLayer: Container;

  private skylineItems: Text[] = [];
  private rooftopItems: Text[] = [];

  constructor() {
    this.container = new Container();
    this.skylineLayer = new Container();
    this.rooftopLayer = new Container();
    this.container.addChild(this.skylineLayer, this.rooftopLayer);
  }

  init(viewportW: number, viewportH: number): void {
    // Far skyline — large purple city emoji tiled
    const skylineCount = Math.ceil(viewportW / 80) + 2;
    for (let i = 0; i < skylineCount; i++) {
      const t = new Text('🌆', { fontSize: 80 } as unknown as never);
      t.x = i * 80;
      t.y = viewportH * 0.3;
      (t as unknown as { tint: number }).tint = NEON_PURPLE;
      this.skylineLayer.addChild(t);
      this.skylineItems.push(t);
    }

    // Near rooftops — smaller cyan buildings
    const rooftopCount = Math.ceil(viewportW / 48) + 2;
    for (let i = 0; i < rooftopCount; i++) {
      const t = new Text('🏢', { fontSize: 48 } as unknown as never);
      t.x = i * 48;
      t.y = viewportH * 0.5;
      (t as unknown as { tint: number }).tint = NEON_CYAN;
      this.rooftopLayer.addChild(t);
      this.rooftopItems.push(t);
    }
  }

  /** Scroll background by scrollOffset — layers move at different speeds (parallax) */
  syncScroll(scrollOffset: number): void {
    // Far skyline at 30% speed
    this.skylineLayer.x = -(scrollOffset * 0.3) % (this.skylineItems.length * 80);
    // Near rooftops at 70% speed
    this.rooftopLayer.x = -(scrollOffset * 0.7) % (this.rooftopItems.length * 48);
  }

  destroy(): void {
    for (const t of [...this.skylineItems, ...this.rooftopItems]) {
      gsap.killTweensOf(t);
      t.destroy();
    }
    this.skylineItems = [];
    this.rooftopItems = [];
  }
}
