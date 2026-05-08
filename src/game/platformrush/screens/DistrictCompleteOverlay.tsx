/**
 * DistrictCompleteOverlay — branch shown from ResultsScreen after all 8 courses complete.
 *
 * Shows district name, total stars collected, Next District button.
 * Next District button calls unlockNextDistrict + navigates to 'start'.
 *
 * Rendered inside the 'results' screen ID (no new screen ID — collision-resolved).
 */
import { Show } from 'solid-js';
import { useScreen } from '~/core/systems/screens';
import { Button } from '~/core/ui/Button';
import type { ProgressionStore } from './progressionStore';
import { unlockNextDistrict } from './progressionStore';

interface DistrictCompleteOverlayProps {
  store: ProgressionStore;
  districtIndex: number;
  totalStars: number;
  onNextDistrict?: () => void;
}

const DISTRICT_NAMES = ['Neon Rooftops', 'Cyber Underpass', 'Chrome Skyway'];

export function DistrictCompleteOverlay(props: DistrictCompleteOverlayProps) {
  const { goto } = useScreen();

  const isLastDistrict = () => props.districtIndex >= 2;

  const handleNext = () => {
    if (!isLastDistrict()) {
      unlockNextDistrict(props.store, props.districtIndex);
    }
    props.onNextDistrict?.();
    goto('start');
  };

  const districtName = () => DISTRICT_NAMES[props.districtIndex] ?? `District ${props.districtIndex + 1}`;

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-black px-6 gap-8">
      <p class="text-5xl">🏙️</p>
      <h1 class="text-3xl font-bold text-white text-center">
        {districtName()} Complete!
      </h1>

      <div class="flex items-center gap-2 text-3xl">
        <span class="text-amber-400 font-bold">{props.totalStars}</span>
        <span class="text-2xl">⭐</span>
        <span class="text-white/60 text-base ml-2">total stars</span>
      </div>

      <Show
        when={!isLastDistrict()}
        fallback={
          <Button onClick={handleNext}>Back to Map</Button>
        }
      >
        <Button onClick={handleNext}>Next District →</Button>
      </Show>
    </div>
  );
}
