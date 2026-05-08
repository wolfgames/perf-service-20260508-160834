/**
 * Platform entity logic — pure functions.
 * No Pixi, no Math.random, no DOM.
 */
import { GRAVITY, SHORT_HOP_APEX } from '~/game/platformrush/logic/physics';
import type { PlatformType, AnimationEvent } from '~/game/platformrush/state/types';

export const CRUMBLE_DELAY_MS = 500; // total time from landing to disappearance
export const CRUMBLE_ANIM_MS = 300;  // animation duration
export const BOUNCE_MULTIPLIER = 1.8;

export interface Platform {
  x: number;
  y: number;
  width: number;
  type: PlatformType;
}

export interface Runner {
  x: number;
  y: number;
}

/** True when the runner's x is within the platform's horizontal span */
export const checkRunnerOnPlatform = (runner: Runner, platform: Platform): boolean =>
  runner.x >= platform.x && runner.x <= platform.x + platform.width &&
  runner.y === platform.y;

interface CrumbleResult {
  events: Array<AnimationEvent & { animDuration?: number }>;
  crumbleCompleteMs: number;
}

/** Emit crumble-start event for a crumbling platform */
export const triggerCrumble = (): CrumbleResult => ({
  events: [{ type: 'crumble-start', animDuration: CRUMBLE_ANIM_MS }],
  crumbleCompleteMs: CRUMBLE_DELAY_MS,
});

interface BounceResult {
  bouncyVY: number;
  events: AnimationEvent[];
}

/** Compute bounce velocity (1.8× short-hop apex) */
export const triggerBounce = (): BounceResult => {
  const apex = SHORT_HOP_APEX * BOUNCE_MULTIPLIER;
  const bouncyVY = -Math.sqrt(2 * GRAVITY * apex);
  return {
    bouncyVY,
    events: [{ type: 'bounce-launch', bouncyVY }],
  };
};
