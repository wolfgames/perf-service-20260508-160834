---
type: game-report
game: PlatformRush
pipeline_version: "0.3.13"
run: 01
pass: core
status: partial
features:
  total: 31
  implemented: 16
  partial: 6
  deferred: 9
tests:
  new: 11
  passing: 247
  total: 267
issues:
  critical: 0
  minor: 3
cos:
  - id: core-interaction
    status: partial
    note: "one-gesture pointer-event tap/hold implemented; input blocked in non-IDLE; touch-action:none fixed this phase. Gap: no visible rejection feedback when jump input is blocked during AIRBORNE/LANDING (silent drop, not shake/flash)."
  - id: canvas
    status: pass
    note: "Runner ≥48px emoji, 3 platform types visually distinct (Normal/Crumbling/Bouncy), neon cityscape parallax. HUD 80px + play 700px + DOM-bottom 64px = 844px exact, no overlap."
  - id: animated-dynamics
    status: partial
    note: "Event queue, stable runner identity, gravity acceleration, and no instant state changes all implemented. Gap: landing squash/settle animation missing — runner transitions LANDING→IDLE with no visual compression/bounce."
  - id: scoring
    status: pass
    note: "finalScore = tokensCollected × 10 × clamp(parTime/actualTime, 1.0, 2.0). Two multiplicative dimensions: token magnitude × speed efficiency. Skilled player test (all tokens @ 0.5×parTime vs 0 tokens @ 3×parTime) confirms ≥3× ratio."
completeness:
  items_required: 26
  items_met: 17
  items_gaps: 9
blocking:
  cos_failed: []
  completeness_gaps:
    - "landing-squash-animation: animated-dynamics landing settle not implemented (LANDING→IDLE with no squash visual)"
    - "silent-input-rejection: no visible feedback (shake/flash) when jump input blocked during non-IDLE state"
    - "interaction-archetype-doc: interaction-archetype.md missing (core-interaction CoS exit criterion)"
    - "course-lifecycle-unwired: PlatformRenderer/TokenRenderer/ObstacleRenderer/FinishFlagRenderer not instantiated in GameController — course does not render"
    - "win-loss-sequence-unwired: WinSequenceController and LossSequenceController created but not instantiated in GameController"
    - "course-interstitial-unwired: CourseStartInterstitial not wired into pre-game lifecycle"
    - "district-map-unwired: DistrictMapOverlay not rendered in StartScreen"
    - "platform-count-below-spec: levelGenerator COURSE_PLATFORMS=12 (GDD spec: 24), MIN_PLATFORMS=5 (GDD spec: 20) — procedural courses shorter than designed"
    - "score-popup-unwired: token-pop animation event emitted but TokenRenderer not in GameController to display it"
---

# Pipeline Report: PlatformRush

## Status: partial

Build: PASS (0 errors, chunk-size warning only).
Tests: 247 passing / 267 total. 20 pre-existing failures (scaffold facade mock mismatch, unrelated to PlatformRush implementation).

## Blocking issues — must resolve before next pass

### CoS gaps (partial — not failed)

- **CoS partial — `animated-dynamics`**: Landing squash/settle animation missing. Runner jumps correctly (parabolic arc, gravity acceleration) but transitions LANDING→IDLE with no visual compression or bounce. Exit criterion: "When an object lands, it compresses (squash) then rebounds."
- **CoS partial — `core-interaction`**: Silent input rejection. When player taps during AIRBORNE/LANDING/BOUNCING, input is silently dropped. Exit criterion: "Invalid gestures produce visible feedback (elastic snap-back, shake, flash — not silence)."

### Completeness gaps

- **course-lifecycle-unwired**: PlatformRenderer, TokenRenderer, ObstacleRenderer, FinishFlagRenderer all exist but are not instantiated in GameController. The full course (platforms, tokens, obstacles, finish flag) is not visible or interactive. Core gameplay is not fully playable from player perspective. This requires courseLoader → ECS entity lifecycle + per-tick collision sweeps — new logic exceeding wiring-fix ceiling.
- **win-loss-sequence-unwired**: WinSequenceController and LossSequenceController are fully implemented but never instantiated in GameController. Game transitions to results DOM screen via GameScreen createEffect, but GPU celebration/mourning sequences don't play.
- **course-interstitial-unwired**: CourseStartInterstitial exists but is not called before game start.
- **district-map-unwired**: DistrictMapOverlay exists but is not rendered in StartScreen.
- **platform-count-below-spec**: Procedural generator uses COURSE_PLATFORMS=12 (GDD specifies 24) and MIN_PLATFORMS=5 (GDD specifies 20), producing shorter courses than designed.
- **silent-input-rejection**: No shake/flash animation when jump is blocked. Minor UX gap.
- **interaction-archetype-doc**: Interaction archetype document required by core-interaction CoS exit criterion is missing from the game root.
- **score-popup-unwired**: token-pop animation event is emitted by tokenLogic but TokenRenderer is not instantiated in GameController to display the +10 pop visual.

## Features

### Implemented (player-visible)

- [x] ECS Plugin (PlatformRushPlugin) — all resources, archetypes, transactions, correct property order
- [x] Game state signals — bridgeEcsToSignals wires score/stars/tokens/retries/boardState to DOM
- [x] Game Controller — Pixi Application, correct layer hierarchy, destroy order (GSAP→Pixi→bridge→setActiveDb(null))
- [x] Runner renderer — 48px emoji, 7 animation states, syncState/syncPosition
- [x] Board state machine — all 7 states (IDLE/AIRBORNE/LANDING/BOUNCING/WON/FALLING/PAUSED)
- [x] Physics engine — gravity 9.8×64 px/s², short-hop 96px, long-leap 160px, hold clamped at 500ms
- [x] Tap/hold input system — pointer events, radial-fill charge indicator (GSAP), input gating
- [x] Platform logic (pure) — Normal/Crumbling/Bouncy types, crumble/bounce events
- [x] Level generator — seeded deterministic LCG, 6-step algorithm, 10-retry + fallback chain
- [x] Hand-crafted fixtures — district-0 (course-0, course-1, fallback)
- [x] Solvability validator — GAP_TOO_WIDE, TOO_MANY_CONSECUTIVE_CRUMBLING, COURSE_TOO_SHORT
- [x] Scoring system — tokenScore × speedMultiplier (2 multiplicative dimensions)
- [x] Star rating — 1/2/3 stars at 0%/50%/90% token collection
- [x] Token logic (pure) — collectToken, 32px hitbox, token-pop event
- [x] Obstacle logic (pure) — crate collision, fan zone (70% speed)
- [x] HUD renderer — score, 3 stars, progress bar, pause button (GPU, top 80px)
- [x] Background renderer — 2-layer parallax neon cityscape (purple/cyan emoji)
- [x] Asset manifest — 5 PlatformRush bundles (scene, fx, audio-sfx, audio-music, data)
- [x] Results screen — win/loss branching, "Nice try!" copy, no "Game Over"
- [x] WinSequenceController — GSAP trophy pop-in, staggered stars, score count-up
- [x] LossSequenceController — GSAP fade-to-dark, "Nice try!" fade-in, token roll-up
- [x] Start screen — "PlatformRush" branding, neon palette, Play button in thumb zone
- [x] Screen navigation — WON/FALLING states auto-navigate to results (createEffect in GameScreen)

### Partial / unwired

- [ ] PlatformRenderer — implemented, not wired into GameController (blocked by course lifecycle)
- [ ] TokenRenderer — implemented, not wired (blocked by course lifecycle)
- [ ] ObstacleRenderer — implemented, not wired
- [ ] FinishFlagRenderer — implemented, not wired
- [ ] CourseStartInterstitial — implemented, not wired into pre-game
- [ ] DistrictMapOverlay — implemented, not wired into StartScreen
- [ ] DistrictCompleteOverlay — implemented, not wired into ResultsScreen

### Deferred

- [ ] Course lifecycle in GameController (courseLoader → ECS entities → per-tick collision) — requires new logic >wiring ceiling; deferred to run-02 or secondary pass
- [ ] Win/Loss GPU sequences in GameController — sequences exist but controller entry point not wired
- [ ] Landing squash/settle animation — animated-dynamics partial gap; targeted fix for next run
- [ ] Visible input rejection feedback (shake/flash on blocked tap) — core-interaction minor gap
- [ ] interaction-archetype.md doc — documentation requirement; minor
- [ ] District/course persistence across sessions — in-memory only per plan (deferred to meta pass)
- [ ] Full 3-district fixture set (24 files) — only district-0 (3 files) implemented per plan
- [ ] Skill-curve tuning — deferred to meta pass per conditions/index.md

## CoS Compliance — pass `core`

| CoS                    | Status  | Evidence / note |
|------------------------|---------|-----------------|
| `core-interaction`     | partial | Pointer events, hold timing, input gating all correct. Touch-action:none fixed this phase. Gap: silent input rejection (no visible shake when AIRBORNE blocks jump). |
| `canvas`               | pass    | Runner 48px emoji; 3 platform types distinct (Normal ⬛ / Crumbling 🟧 / Bouncy 🟩); HUD 80px + play 700px + DOM 64px = 844px. |
| `animated-dynamics`    | partial | Event queue, gravity arc, stable runner ID, no instant state changes. Gap: landing squash/settle animation absent. |
| `scoring` (base)       | pass    | finalScore = tokens × 10 × speedMultiplier; 2 multiplicative dims; skilled-player test ≥3×. |
| `skill-curve`          | deferred-to-pass-meta | Level progression difficulty tuning; deferred per plan. |
| `pattern-busters`      | deferred-to-pass-secondary | No special pieces in core pass. |

## Completeness — pass `core`

| Area                   | Required | Met | Gaps |
|------------------------|----------|-----|------|
| Interaction            | 5        | 4   | 1 (silent rejection) |
| Board & Pieces         | 4        | 4   | 0 |
| Core Mechanics         | 6        | 4   | 2 (course not rendered; score popup unwired) |
| Scoring (base)         | 3        | 2   | 1 (score popup unwired) |
| CoS gate               | 4        | 2   | 2 (core-interaction partial, animated-dynamics partial) |

## Known Issues

- **Minor**: Procedural level generator produces 12-platform courses (GDD spec: 24). Gameplay is shorter than designed.
- **Minor**: Score popup (+10 animation at token collection) does not display because TokenRenderer is not in GameController.
- **Minor**: No visible feedback when jump is attempted during AIRBORNE (input is silently ignored).

## Deferred

1. **Course lifecycle wiring** (highest priority for next run): courseLoader → ECS entities (Platform/Token/Obstacle/FinishFlag) → per-tick collision → score/win/loss dispatch. This is the core gameplay loop not yet fully playable.
2. **GPU win/loss sequences**: WinSequenceController and LossSequenceController need instantiation in GameController with boardState hooks.
3. **Landing animation**: Add squash-stretch GSAP tween to RunnerRenderer on LANDING state transition.
4. **Input rejection feedback**: Add GSAP horizontal shake to runner on blocked tap.

## Recommendations

1. Run-02 priority: wire the course lifecycle (the 13 unwired modules). Without it, the game cannot complete a course.
2. After course lifecycle: wire WinSequenceController/LossSequenceController for ceremony.
3. Before secondary pass: fix animated-dynamics gap (landing squash) and core-interaction gap (rejection feedback).
4. Consider increasing COURSE_PLATFORMS to 24 and MIN_PLATFORMS to 20 to match GDD spec.
