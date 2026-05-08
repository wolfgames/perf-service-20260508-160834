/**
 * PlatformRush board state machine — pure transition logic.
 *
 * No Pixi, no signals, no Math.random.
 * Every state change emits an animation event so the controller
 * can play visuals via GSAP before committing to ECS.
 */
import { BoardState, type TransitionResult, type AnimationEvent } from '~/game/platformrush/state/types';

const stateChange = (from: BoardState, to: BoardState): AnimationEvent => ({
  type: 'state-change',
  from,
  to,
});

const blocked = (current: BoardState): TransitionResult => ({
  nextState: current,
  animationEvent: { type: 'input-blocked', current },
  blocked: true,
});

/** Returns true only when the runner can accept a jump tap */
export const canAcceptInput = (state: BoardState): boolean => state === BoardState.IDLE;

/**
 * Attempt to transition from current state to AIRBORNE via a tap.
 * Only IDLE allows this; all other states block input.
 */
export const transitionOnTap = (current: BoardState): TransitionResult => {
  if (current !== BoardState.IDLE) return blocked(current);

  return {
    nextState: BoardState.AIRBORNE,
    animationEvent: stateChange(current, BoardState.AIRBORNE),
  };
};

/** Runner touches a platform — transitions from AIRBORNE or BOUNCING to LANDING */
export const transitionToLanding = (current: BoardState): TransitionResult => ({
  nextState: BoardState.LANDING,
  animationEvent: stateChange(current, BoardState.LANDING),
});

/** Short LANDING frame resolves to IDLE */
export const transitionToIdle = (current: BoardState): TransitionResult => ({
  nextState: BoardState.IDLE,
  animationEvent: stateChange(current, BoardState.IDLE),
});

/** Runner hits a bouncy platform */
export const transitionToBouncing = (current: BoardState): TransitionResult => ({
  nextState: BoardState.BOUNCING,
  animationEvent: stateChange(current, BoardState.BOUNCING),
});

/** Runner reaches finish flag */
export const transitionToWon = (current: BoardState): TransitionResult => ({
  nextState: BoardState.WON,
  animationEvent: stateChange(current, BoardState.WON),
});

/** Runner falls off screen or hits crate */
export const transitionToFalling = (current: BoardState): TransitionResult => ({
  nextState: BoardState.FALLING,
  animationEvent: stateChange(current, BoardState.FALLING),
});

/** Pause button tapped */
export const transitionToPaused = (current: BoardState): TransitionResult => ({
  nextState: BoardState.PAUSED,
  animationEvent: stateChange(current, BoardState.PAUSED),
});

/** Unpause — returns to IDLE */
export const transitionToUnpaused = (_current: BoardState): TransitionResult => ({
  nextState: BoardState.IDLE,
  animationEvent: stateChange(BoardState.PAUSED, BoardState.IDLE),
});
