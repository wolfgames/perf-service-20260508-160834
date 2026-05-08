/**
 * CourseStartInterstitial — brief overlay before each course.
 *
 * Shows district name, course number, and descriptor string.
 * Auto-advances after 1.5s via GSAP delayedCall.
 * tap-to-skip available via skip().
 *
 * No DOM usage — pure GSAP + pixi-js-free descriptor string.
 * The host (GameController) is responsible for mounting any visual container.
 */
import { gsap } from 'gsap';

export interface CourseStartInterstitialOptions {
  districtIndex: number;
  courseIndex: number;
  onComplete: () => void;
}

const DISTRICT_NAMES = [
  'Neon Rooftops',
  'Cyber Underpass',
  'Chrome Skyway',
];

export class CourseStartInterstitial {
  private delayHandle: gsap.core.Tween | null = null;
  private onCompleteRef: (() => void) | null = null;
  private descriptor = '';
  private container: { alpha: number } | null = null;

  show({ districtIndex, courseIndex, onComplete }: CourseStartInterstitialOptions): void {
    this.onCompleteRef = onComplete;

    const districtName = DISTRICT_NAMES[districtIndex] ?? `District ${districtIndex + 1}`;
    this.descriptor = `District ${districtIndex + 1} · Course ${courseIndex + 1} — ${districtName}`;

    // Fade in
    this.container = { alpha: 0 };
    gsap.to(this.container, { alpha: 1, duration: 0.2 });

    // Auto-advance after 1.5s
    this.delayHandle = gsap.delayedCall(1.5, () => {
      this._complete();
    }) as unknown as gsap.core.Tween;
  }

  /** Skip interstitial immediately */
  skip(): void {
    this.delayHandle?.kill();
    this.delayHandle = null;
    this._complete();
  }

  /** Returns the descriptor string (district · course — name) */
  getDescriptor(): string {
    return this.descriptor;
  }

  destroy(): void {
    gsap.killTweensOf(this.container);
    this.delayHandle?.kill();
    this.delayHandle = null;
    this.onCompleteRef = null;
    this.container = null;
  }

  private _complete(): void {
    const cb = this.onCompleteRef;
    this.onCompleteRef = null;
    cb?.();
  }
}
