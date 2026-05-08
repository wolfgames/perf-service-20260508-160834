/**
 * tokenLogic — collection and scoring
 */
import { describe, it, expect } from 'vitest';
import { collectToken, isTokenHit, TOKEN_SCORE } from '~/game/platformrush/logic/tokenLogic';

describe('tokenLogic — collection and scoring', () => {
  it('token collect: +10 score event emitted', () => {
    const result = collectToken();
    expect(result.scoreIncrement).toBe(TOKEN_SCORE);
  });

  it('token pop animation fires on collect', () => {
    const result = collectToken();
    expect(result.events.some(e => e.type === 'token-pop')).toBe(true);
    expect(result.events.find(e => e.type === 'token-pop')?.durationMs).toBe(120);
  });

  it('token hitbox is >=32px — isTokenHit uses 32px radius', () => {
    const token = { x: 100, y: 460 };
    const runner = { x: 116, y: 460 }; // 16px offset — within 32px hitbox

    expect(isTokenHit(runner, token)).toBe(true);
  });

  it('runner outside 32px hitbox does not collect', () => {
    const token = { x: 100, y: 460 };
    const runner = { x: 150, y: 460 }; // 50px away — outside hitbox

    expect(isTokenHit(runner, token)).toBe(false);
  });

  it('TOKEN_SCORE is 10', () => {
    expect(TOKEN_SCORE).toBe(10);
  });

  it('runner exactly at token position (zero-distance) is always a hit', () => {
    // Edge case: exact overlap should never miss
    const token = { x: 200, y: 460 };
    const runner = { x: 200, y: 460 };
    expect(isTokenHit(runner, token)).toBe(true);
  });

  it('token 32px away (exactly at hitbox boundary) is still a hit', () => {
    // Edge case: boundary condition — exactly at TOKEN_HITBOX_PX distance
    const token = { x: 200, y: 460 };
    const runner = { x: 232, y: 460 }; // exactly 32px right
    expect(isTokenHit(runner, token)).toBe(true);
  });
});
