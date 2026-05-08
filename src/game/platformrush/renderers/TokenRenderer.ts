/**
 * TokenRenderer — renders speed tokens as '🪙' emoji.
 * 40px above platform surface. Pop animation on collect.
 *
 * No DOM, no requestAnimationFrame. GSAP only.
 */
import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';

interface TokenPos { x: number; y: number; id: number }

interface TokenVisual {
  text: Text;
  id: number;
}

export class TokenRenderer {
  readonly container: Container;
  private visuals: TokenVisual[] = [];

  constructor() {
    this.container = new Container();
  }

  init(tokens: TokenPos[]): void {
    this.clearAll();
    for (const token of tokens) {
      const text = new Text('🪙', { fontSize: 32 } as unknown as never);
      text.x = token.x;
      text.y = token.y - 40; // 40px above platform surface
      this.container.addChild(text);
      this.visuals.push({ text, id: token.id });
    }
  }

  /** Play 120ms pop animation then hide the token */
  playCollect(tokenId: number): void {
    const visual = this.visuals.find(v => v.id === tokenId);
    if (!visual) return;

    gsap.to(visual.text, {
      alpha: 0,
      pixi: { scale: 2 },
      duration: 0.12,
      ease: 'power2.out',
      overwrite: 'auto',
      onComplete: () => {
        visual.text.visible = false;
      },
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
