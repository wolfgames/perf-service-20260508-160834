/**
 * PlatformRush start screen controller.
 *
 * DOM-mode start screen showing 'PlatformRush' title with neon city palette.
 * unlockAudio() is called before any audio on Play tap.
 */
import type {
  StartScreenDeps,
  StartScreenController,
  SetupStartScreen,
} from '~/game/mygame-contract';

export const setupStartScreen: SetupStartScreen = (deps: StartScreenDeps): StartScreenController => {
  let wrapper: HTMLDivElement | null = null;

  return {
    backgroundColor: '#1a1a2e',

    init(container: HTMLDivElement) {
      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'height:100%;gap:32px;background:#1a1a2e;';

      // City skyline background tint (neon purple/cyan)
      const skyline = document.createElement('div');
      skyline.style.cssText =
        'position:absolute;inset:0;background:linear-gradient(180deg,#1a1a2e 0%,#2d1b69 60%,#1a1a2e 100%);' +
        'opacity:0.7;pointer-events:none;';
      skyline.setAttribute('aria-hidden', 'true');

      const title = document.createElement('h1');
      title.textContent = 'PlatformRush';
      title.style.cssText =
        'font-size:2.5rem;font-weight:900;color:#06B6D4;margin:0;' +
        'font-family:system-ui,sans-serif;letter-spacing:0.05em;' +
        'text-shadow:0 0 20px #06B6D4,0 0 40px #8B5CF6;' +
        'position:relative;z-index:1;';

      const subtitle = document.createElement('p');
      subtitle.textContent = '🏃 Race across the rooftops';
      subtitle.style.cssText =
        'font-size:1rem;color:#8B5CF6;margin:0;font-family:system-ui,sans-serif;' +
        'position:relative;z-index:1;';

      // Play button — positioned in bottom ~30% of screen per batch-7 spec
      const playBtn = document.createElement('button');
      playBtn.textContent = 'Play';
      playBtn.style.cssText =
        'font-size:1.25rem;font-weight:700;padding:16px 56px;border:none;border-radius:16px;' +
        'background:#06B6D4;color:#fff;cursor:pointer;font-family:system-ui,sans-serif;' +
        'box-shadow:0 4px 20px rgba(6,182,212,0.4);min-width:44px;min-height:44px;' +
        'position:relative;z-index:1;margin-top:auto;margin-bottom:30%;';

      playBtn.addEventListener('click', async () => {
        playBtn.disabled = true;
        playBtn.textContent = 'Loading…';

        deps.unlockAudio();
        await deps.initGpu().catch(console.error);
        await deps.loadCore().catch(console.error);
        try { await deps.loadAudio(); } catch { /* audio optional */ }

        deps.analytics.trackGameStart({ start_source: 'play_button', is_returning_player: false });
        deps.goto('game');
      }, { once: true });

      wrapper.append(skyline, title, subtitle, playBtn);
      container.append(wrapper);
    },

    destroy() {
      wrapper?.remove();
      wrapper = null;
    },
  };
};
