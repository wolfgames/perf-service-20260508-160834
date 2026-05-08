/**
 * PlatformRush — game contract entry point.
 *
 * Exports setupGame and setupStartScreen per the mygame-contract interface.
 */
export { setupGame } from './GameController';
export { setupStartScreen } from './StartScreenController';
export type {
  SetupGame,
  SetupStartScreen,
  GameControllerDeps,
  StartScreenDeps,
  GameController,
  StartScreenController,
  GameMode,
} from '~/game/mygame-contract';
