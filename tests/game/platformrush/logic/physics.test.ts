/**
 * physics — jump arc calculation
 *
 * Pure function tests — no Pixi, no Math.random, deterministic.
 * Gravity: 9.8 × 64 = 627.2 px/s²
 * Short hop: apex ~96 px, duration ~400 ms
 * Long leap: apex ~160 px at 500 ms hold
 */
import { describe, it, expect } from 'vitest';
import {
  calcJumpVelocity,
  tickPhysics,
  GRAVITY,
  SHORT_HOP_APEX,
  LONG_LEAP_APEX,
  SCROLL_SPEED,
  GROUND_Y,
} from '~/game/platformrush/logic/physics';

// Helper: simulate a full jump arc from ground, return apex and total duration
function simulateJump(holdMs: number) {
  const vY = calcJumpVelocity(holdMs);
  let y = GROUND_Y;
  let vy = vY;
  let elapsedMs = 0;
  let apex = y;
  const dt = 16; // ~60fps frame

  while (true) {
    // Advance one frame
    const dtSec = dt / 1000;
    vy += GRAVITY * dtSec; // gravity acts downward (positive y = down)
    y += vy * dtSec;

    if (y < apex) apex = y;
    elapsedMs += dt;

    // Stop when runner reaches or passes ground
    if (y >= GROUND_Y) break;
    if (elapsedMs > 2000) break; // safety
  }

  return { apexDistance: GROUND_Y - apex, durationMs: elapsedMs };
}

describe('physics — jump arc calculation', () => {
  it('short hop: apex ~96 px at 0 ms hold', () => {
    const { apexDistance } = simulateJump(0);
    // Allow ±10 px tolerance for discrete simulation
    expect(apexDistance).toBeGreaterThan(86);
    expect(apexDistance).toBeLessThan(106);
  });

  it('long leap: apex ~160 px at 500 ms hold', () => {
    const { apexDistance } = simulateJump(500);
    // Allow ±10 px tolerance
    expect(apexDistance).toBeGreaterThan(150);
    expect(apexDistance).toBeLessThan(170);
  });

  it('long leap arc is longer than short hop arc', () => {
    const shortHop = simulateJump(0);
    const longLeap = simulateJump(500);
    // Long leap should take measurably more time
    expect(longLeap.durationMs).toBeGreaterThan(shortHop.durationMs);
  });

  it('hold > 500 ms clamped to 500 ms behavior', () => {
    const vAt500 = calcJumpVelocity(500);
    const vAt800 = calcJumpVelocity(800);
    expect(vAt500).toBe(vAt800);
  });

  it('gravity acceleration (not constant speed)', () => {
    // In constant-speed the delta would be equal every frame; with gravity it differs
    const vY = calcJumpVelocity(0);
    const dtSec = 0.016;

    let vy1 = vY;
    let vy2 = vY;

    vy1 += GRAVITY * dtSec; // frame 1
    vy2 = vy1 + GRAVITY * dtSec; // frame 2

    expect(vy2).not.toBe(vy1); // velocity must change (acceleration)
    expect(vy2).toBeGreaterThan(vy1); // falling faster each frame
  });

  it('tickPhysics returns animationEvents for state transition', () => {
    const state = {
      runnerY: GROUND_Y,
      runnerVY: calcJumpVelocity(0),
      boardState: 'AIRBORNE' as const,
      groundY: GROUND_Y,
    };
    const result = tickPhysics(state, 16);
    expect(result.animationEvents).toBeDefined();
    expect(Array.isArray(result.animationEvents)).toBe(true);
  });

  it('SCROLL_SPEED is 180 px/s', () => {
    expect(SCROLL_SPEED).toBe(180);
  });

  it('GRAVITY is 9.8 * 64', () => {
    expect(GRAVITY).toBeCloseTo(9.8 * 64, 1);
  });
});
