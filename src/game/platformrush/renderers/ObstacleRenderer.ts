/**
 * ObstacleRenderer — renders obstacles as labeled emoji text.
 *
 * Crate='📦', Fan='💨'
 * No DOM, no requestAnimationFrame. GSAP only.
 */
import { Container, Text } from 'pixi.js';
import { gsap } from 'gsap';

interface ObstaclePos { x: number; y: number; kind: 'crate' | 'fan'; id: number }

const OBSTACLE_EMOJI: Record<'crate' | 'fan', string> = {
  crate: '📦',
  fan: '💨',
};

interface ObstacleVisual {
  text: Text;
  id: number;
}

export class ObstacleRenderer {
  readonly container: Container;
  private visuals: ObstacleVisual[] = [];

  constructor() {
    this.container = new Container();
  }

  init(obstacles: ObstaclePos[]): void {
    this.clearAll();
    for (const obs of obstacles) {
      const text = new Text(OBSTACLE_EMOJI[obs.kind], { fontSize: 40 } as unknown as never);
      text.x = obs.x;
      text.y = obs.y - 40;
      this.container.addChild(text);
      this.visuals.push({ text, id: obs.id });
    }
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
