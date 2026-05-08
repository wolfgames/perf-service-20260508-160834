/**
 * Obstacle logic — pure functions.
 * No Pixi, no Math.random.
 *
 * Crate: 48×48px hitbox, collision → FALLING
 * Fan: 96×64px zone, reduces scroll speed to 70%
 */
import type { AnimationEvent } from '~/game/platformrush/state/types';

export const FAN_SPEED_MULTIPLIER = 0.7;
const CRATE_HITBOX_PX = 48;
const FAN_ZONE_W = 96;

interface Pos { x: number; y: number }
interface Obstacle extends Pos { kind: 'crate' | 'fan' }

interface CrateResult {
  hit: boolean;
  events: AnimationEvent[];
}

export const checkCrateCollision = (runner: Pos, crate: Obstacle): CrateResult => {
  const hit =
    Math.abs(runner.x - crate.x) <= CRATE_HITBOX_PX / 2 &&
    Math.abs(runner.y - crate.y) <= CRATE_HITBOX_PX / 2;

  return {
    hit,
    events: hit ? [{ type: 'crate-hit' }] : [],
  };
};

interface FanResult {
  inZone: boolean;
  speedMultiplier: number;
}

export const checkFanZone = (runner: Pos, fan: Obstacle): FanResult => {
  const inZone =
    runner.x >= fan.x && runner.x <= fan.x + FAN_ZONE_W &&
    Math.abs(runner.y - fan.y) <= 32;

  return {
    inZone,
    speedMultiplier: inZone ? FAN_SPEED_MULTIPLIER : 1.0,
  };
};
