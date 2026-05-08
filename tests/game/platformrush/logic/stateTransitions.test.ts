/**
 * board-states — state machine transitions
 *
 * Tests the pure transition logic for the PlatformRush board state machine.
 * No Pixi, no signals, no external state.
 */
import { describe, it, expect } from 'vitest';
import { BoardState } from '~/game/platformrush/state/types';
import {
  transitionOnTap,
  canAcceptInput,
  transitionToIdle,
  transitionToLanding,
} from '~/game/platformrush/logic/stateTransitions';

describe('board-states — state machine transitions', () => {
  it('IDLE tap -> AIRBORNE', () => {
    const result = transitionOnTap(BoardState.IDLE);
    expect(result.nextState).toBe(BoardState.AIRBORNE);
    expect(result.animationEvent).toBeDefined();
    expect(result.animationEvent.type).toBe('state-change');
  });

  it('AIRBORNE blocks second tap', () => {
    const result = transitionOnTap(BoardState.AIRBORNE);
    expect(result.nextState).toBe(BoardState.AIRBORNE); // unchanged
    expect(result.blocked).toBe(true);
  });

  it('state change emits animation event', () => {
    const result = transitionOnTap(BoardState.IDLE);
    expect(result.animationEvent).toBeDefined();
    expect(result.animationEvent.type).toBe('state-change');
    expect(result.animationEvent.from).toBe(BoardState.IDLE);
    expect(result.animationEvent.to).toBe(BoardState.AIRBORNE);
  });

  it('LANDING blocks tap (non-idle state)', () => {
    const result = transitionOnTap(BoardState.LANDING);
    expect(result.blocked).toBe(true);
  });

  it('WON blocks tap', () => {
    const result = transitionOnTap(BoardState.WON);
    expect(result.blocked).toBe(true);
  });

  it('FALLING blocks tap', () => {
    const result = transitionOnTap(BoardState.FALLING);
    expect(result.blocked).toBe(true);
  });

  it('PAUSED blocks tap (only unpause via pause button)', () => {
    const result = transitionOnTap(BoardState.PAUSED);
    expect(result.blocked).toBe(true);
  });

  it('canAcceptInput returns true only for IDLE', () => {
    expect(canAcceptInput(BoardState.IDLE)).toBe(true);
    expect(canAcceptInput(BoardState.AIRBORNE)).toBe(false);
    expect(canAcceptInput(BoardState.LANDING)).toBe(false);
    expect(canAcceptInput(BoardState.BOUNCING)).toBe(false);
    expect(canAcceptInput(BoardState.WON)).toBe(false);
    expect(canAcceptInput(BoardState.FALLING)).toBe(false);
    expect(canAcceptInput(BoardState.PAUSED)).toBe(false);
  });

  it('transitionToIdle from LANDING emits animation event', () => {
    const result = transitionToIdle(BoardState.LANDING);
    expect(result.nextState).toBe(BoardState.IDLE);
    expect(result.animationEvent).toBeDefined();
  });

  it('transitionToLanding from AIRBORNE emits animation event', () => {
    const result = transitionToLanding(BoardState.AIRBORNE);
    expect(result.nextState).toBe(BoardState.LANDING);
    expect(result.animationEvent).toBeDefined();
  });

  it('BOUNCING state blocks tap (edge case: no double-jump from bounce)', () => {
    // Edge case: bounce puts runner in BOUNCING, which should also block double-jump
    const result = transitionOnTap(BoardState.BOUNCING);
    expect(result.blocked).toBe(true);
    expect(result.nextState).toBe(BoardState.BOUNCING); // unchanged
  });
});
