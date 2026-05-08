/** PlatformRush game state types */

export const BoardState = {
  IDLE: 'IDLE',
  AIRBORNE: 'AIRBORNE',
  LANDING: 'LANDING',
  BOUNCING: 'BOUNCING',
  WON: 'WON',
  FALLING: 'FALLING',
  PAUSED: 'PAUSED',
} as const;

export type BoardState = (typeof BoardState)[keyof typeof BoardState];

export type PlatformType = 'normal' | 'crumbling' | 'bouncy';
export type ObstacleKind = 'crate' | 'fan';

export interface AnimationEvent {
  type: string;
  [key: string]: unknown;
}

export interface StateChangeEvent extends AnimationEvent {
  type: 'state-change';
  from: BoardState;
  to: BoardState;
}

export interface TransitionResult {
  nextState: BoardState;
  animationEvent: AnimationEvent;
  blocked?: boolean;
}
