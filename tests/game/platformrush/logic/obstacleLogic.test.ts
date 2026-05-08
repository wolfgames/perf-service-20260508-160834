/**
 * obstacleLogic — crate and fan behaviors
 */
import { describe, it, expect } from 'vitest';
import {
  checkCrateCollision,
  checkFanZone,
  FAN_SPEED_MULTIPLIER,
} from '~/game/platformrush/logic/obstacleLogic';

describe('obstacleLogic — crate and fan behaviors', () => {
  it('crate contact -> boardState FALLING event emitted', () => {
    const crate = { x: 200, y: 500, kind: 'crate' as const };
    const runner = { x: 200, y: 500 };

    const result = checkCrateCollision(runner, crate);
    expect(result.hit).toBe(true);
    expect(result.events.some(e => e.type === 'crate-hit')).toBe(true);
  });

  it('runner not on crate returns hit=false', () => {
    const crate = { x: 200, y: 500, kind: 'crate' as const };
    const runner = { x: 400, y: 500 };

    const result = checkCrateCollision(runner, crate);
    expect(result.hit).toBe(false);
  });

  it('fan zone -> scrollSpeed * 0.7', () => {
    const fan = { x: 300, y: 500, kind: 'fan' as const };
    const runner = { x: 330, y: 500 }; // within fan zone (96px wide)

    const result = checkFanZone(runner, fan);
    expect(result.inZone).toBe(true);
    expect(result.speedMultiplier).toBeCloseTo(FAN_SPEED_MULTIPLIER, 5);
  });

  it('runner outside fan zone returns inZone=false', () => {
    const fan = { x: 300, y: 500, kind: 'fan' as const };
    const runner = { x: 500, y: 500 }; // outside 96px zone

    const result = checkFanZone(runner, fan);
    expect(result.inZone).toBe(false);
  });

  it('FAN_SPEED_MULTIPLIER is 0.7', () => {
    expect(FAN_SPEED_MULTIPLIER).toBe(0.7);
  });
});
