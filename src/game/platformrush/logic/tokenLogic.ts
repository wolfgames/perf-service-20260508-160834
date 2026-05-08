/**
 * Token entity logic — pure functions.
 * No Pixi, no Math.random.
 */
import type { AnimationEvent } from '~/game/platformrush/state/types';

export const TOKEN_SCORE = 10;
export const TOKEN_HITBOX_PX = 32; // half-width hitbox

interface Pos { x: number; y: number }

/** True when runner overlaps a token's hitbox */
export const isTokenHit = (runner: Pos, token: Pos): boolean =>
  Math.abs(runner.x - token.x) <= TOKEN_HITBOX_PX &&
  Math.abs(runner.y - token.y) <= TOKEN_HITBOX_PX;

interface CollectResult {
  scoreIncrement: number;
  events: Array<AnimationEvent & { durationMs?: number }>;
}

/** Emit collection events — caller updates ECS state */
export const collectToken = (): CollectResult => ({
  scoreIncrement: TOKEN_SCORE,
  events: [{ type: 'token-pop', durationMs: 120 }],
});
