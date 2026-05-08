/**
 * PlatformRush physics — pure functions, no Pixi, no Math.random.
 *
 * Gravity: 9.8 × 64 px/s² (downward, positive direction)
 * Short-hop apex: 96 px (hold 0 ms)
 * Long-leap apex: 160 px (hold 500 ms)
 * Hold clamped at 500 ms max.
 * Horizontal scroll speed: 180 px/s constant.
 *
 * Physics derived from: v² = 2 × g × h → v₀ = sqrt(2 × g × apex)
 * (negative because runner launches upward in screen coords)
 */

export const GRAVITY = 9.8 * 64;      // px/s²  (positive = downward)
export const SHORT_HOP_APEX = 96;      // px
export const LONG_LEAP_APEX = 160;     // px
export const SCROLL_SPEED = 180;       // px/s
export const MAX_HOLD_MS = 500;        // ms
export const GROUND_Y = 620;           // px from top of play area (default for 780px canvas)

// v₀ = -sqrt(2 × g × apex) — negative because upward
const apexToVelocity = (apex: number) => -Math.sqrt(2 * GRAVITY * apex);

const SHORT_HOP_VY = apexToVelocity(SHORT_HOP_APEX);
const LONG_LEAP_VY = apexToVelocity(LONG_LEAP_APEX);

/**
 * Calculate initial vertical velocity from tap-hold duration.
 * 0 ms → short hop. 500 ms → long leap. Linearly interpolated.
 */
export const calcJumpVelocity = (holdMs: number): number => {
  const t = Math.min(holdMs, MAX_HOLD_MS) / MAX_HOLD_MS; // 0..1
  return SHORT_HOP_VY + (LONG_LEAP_VY - SHORT_HOP_VY) * t;
};

export interface PhysicsState {
  runnerY: number;
  runnerVY: number;
  boardState: 'AIRBORNE' | 'LANDING' | 'IDLE' | 'BOUNCING' | 'WON' | 'FALLING' | 'PAUSED';
  groundY: number;
}

export interface PhysicsResult {
  runnerY: number;
  runnerVY: number;
  animationEvents: Array<{ type: string; [k: string]: unknown }>;
  landed: boolean;
}

/**
 * Advance physics by one frame (dtMs milliseconds).
 * Returns new runner position and any animation events generated.
 * Does NOT modify input state — pure function.
 */
export const tickPhysics = (state: PhysicsState, dtMs: number): PhysicsResult => {
  const dtSec = dtMs / 1000;
  const events: PhysicsResult['animationEvents'] = [];

  if (state.boardState !== 'AIRBORNE' && state.boardState !== 'BOUNCING') {
    return {
      runnerY: state.runnerY,
      runnerVY: state.runnerVY,
      animationEvents: events,
      landed: false,
    };
  }

  const newVY = state.runnerVY + GRAVITY * dtSec;
  let newY = state.runnerY + newVY * dtSec;
  let landed = false;

  if (newY >= state.groundY) {
    newY = state.groundY;
    landed = true;
    events.push({ type: 'runner-landed', y: newY });
  }

  return { runnerY: newY, runnerVY: newVY, animationEvents: events, landed };
};
