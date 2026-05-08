import { Show } from 'solid-js';
import { useScreen } from '~/core/systems/screens';
import { Button } from '~/core/ui/Button';
import { gameState } from '~/game/state';
import { BoardState } from '~/game/platformrush/state/types';

/**
 * ResultsScreen — win/loss branching.
 *
 * Win branch (boardState === WON): trophy, star count, score, Continue button.
 * Loss branch (boardState === FALLING): "Nice try!" copy, tokens collected,
 *   Try Again button (hidden if retriesRemaining === 0), Main Menu button.
 */
export function ResultsScreen() {
  const { goto } = useScreen();

  const isWin = () => gameState.boardState?.() === BoardState.WON;

  const handleContinue = () => {
    goto('start');
  };

  const handleTryAgain = () => {
    gameState.reset();
    goto('game');
  };

  const handleMainMenu = () => {
    goto('start');
  };

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black px-6">
      <Show
        when={isWin()}
        fallback={
          /* Loss branch */
          <div class="flex flex-col items-center gap-6">
            <p class="text-4xl font-bold text-white">Nice try!</p>

            <div class="text-center">
              <p class="text-white/60 text-sm mb-1">Tokens collected</p>
              <p class="text-3xl font-bold text-amber-400">
                {gameState.tokensCollected()} / {gameState.tokensTotal()}
              </p>
            </div>

            <div class="flex gap-4">
              <Show when={gameState.retriesRemaining() > 0}>
                <Button onClick={handleTryAgain}>Try Again</Button>
              </Show>
              <Button variant="secondary" onClick={handleMainMenu}>
                Main Menu
              </Button>
            </div>
          </div>
        }
      >
        {/* Win branch */}
        <div class="flex flex-col items-center gap-6">
          <p class="text-6xl">🏆</p>
          <p class="text-4xl font-bold text-white">Course Complete!</p>

          <div class="flex gap-2 text-4xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <span>{i < gameState.stars() ? '⭐' : '☆'}</span>
            ))}
          </div>

          <div class="text-center">
            <p class="text-white/60 text-sm mb-1">Score</p>
            <p class="text-5xl font-bold text-white">{gameState.score()}</p>
          </div>

          <Button onClick={handleContinue}>Continue</Button>
        </div>
      </Show>
    </div>
  );
}
