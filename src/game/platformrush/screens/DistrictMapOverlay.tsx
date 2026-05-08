/**
 * DistrictMapOverlay — SolidJS overlay on start screen.
 *
 * Shows 3 district rows × 8 course nodes.
 * Node states: locked '🔒', unlocked '○', complete (stars).
 * Locked tap → rejection shake via GSAP.
 * Unlocked tap → onCourseSelect fires CourseStartInterstitial.
 *
 * DOM overlay positioned over the start screen.
 */
import { For, Show } from 'solid-js';
import { gsap } from 'gsap';
import type { ProgressionStore } from './progressionStore';
import { canStartCourse, getNodeState } from './progressionStore';

interface DistrictMapOverlayProps {
  store: ProgressionStore;
  onCourseSelect: (districtIndex: number, courseIndex: number) => void;
}

const DISTRICT_NAMES = ['Neon Rooftops', 'Cyber Underpass', 'Chrome Skyway'];

export function DistrictMapOverlay(props: DistrictMapOverlayProps) {
  const handleNodeTap = (
    e: MouseEvent | TouchEvent,
    districtIndex: number,
    courseIndex: number,
  ) => {
    if (canStartCourse(props.store, districtIndex, courseIndex)) {
      props.onCourseSelect(districtIndex, courseIndex);
    } else {
      // Rejection shake animation on locked node
      gsap.to(e.currentTarget as HTMLElement, {
        x: 6,
        duration: 0.05,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          gsap.set(e.currentTarget as HTMLElement, { x: 0 });
        },
      });
    }
  };

  return (
    <div
      class="fixed inset-0 overflow-y-auto bg-black/80 flex flex-col gap-6 p-6 pt-16"
      style={{ 'z-index': '10' }}
    >
      <For each={DISTRICT_NAMES}>
        {(districtName, di) => (
          <div class="flex flex-col gap-3">
            <h2 class="text-lg font-bold text-cyan-400">{districtName}</h2>
            <div class="flex flex-wrap gap-2">
              <For each={Array.from({ length: 8 }, (_, i) => i)}>
                {(courseIndex) => {
                  const node = () => getNodeState(props.store, di(), courseIndex);
                  const isAccessible = () => canStartCourse(props.store, di(), courseIndex);

                  return (
                    <button
                      class="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
                      style={{
                        background: isAccessible() ? '#06B6D4' : '#374151',
                        color: isAccessible() ? '#fff' : '#9CA3AF',
                        cursor: isAccessible() ? 'pointer' : 'default',
                        'min-width': '48px',
                        'min-height': '48px',
                      }}
                      onClick={(e) => handleNodeTap(e, di(), courseIndex)}
                    >
                      <Show when={node().status === 'complete'} fallback={
                        <Show when={isAccessible()} fallback="🔒">
                          ○
                        </Show>
                      }>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span style={{ 'font-size': '0.7rem' }}>{i < node().stars ? '⭐' : '☆'}</span>
                        ))}
                      </Show>
                    </button>
                  );
                }}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
