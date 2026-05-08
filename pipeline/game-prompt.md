# PlatformRush
**Tagline:** Every jump tells you exactly how far you can go.
**Genre:** Platformer / Casual Arcade
**Platform:** Mobile first (portrait, touch), playable on web
**Target Audience:** Casual adults 30+

---

## Table of Contents

**The Game**
1. [Game Overview](#game-overview)
2. [At a Glance](#at-a-glance)

**How It Plays**
3. [Core Mechanics](#core-mechanics)
4. [Level Generation](#level-generation)

**How It Flows**
5. [Game Flow](#game-flow)

---

## Game Overview

PlatformRush is a portrait-orientation auto-runner platformer where a lone courier dashes across procedurally generated rooftop courses, collecting speed tokens while leaping over gaps and obstacles. The player taps to jump — one tap for a short hop, hold for a longer leap — and the game's deterministic level generator ensures each run is repeatable and measurable, making it ideal as a performance benchmark while remaining satisfying to play casually. Progress unlocks city districts, each with a distinct skyline and a fresh set of generated courses.

**Setting:** A near-future city of stacked rooftops, sky bridges, and neon-lit terraces. The courier moves left-to-right across the skyline at dusk.

**Core Loop:** Player taps to jump across rooftop platforms -> which collects speed tokens and avoids obstacles -> which completes the course and unlocks the next district level.

## At a Glance

| | |
|---|---|
| **Play Surface** | Scrolling horizontal strip, portrait phone viewport (≈ 9:16) |
| **Input** | Tap (short hop) / Tap-and-hold (long leap) |
| **Entities** | Runner, Platforms (Normal, Crumbling, Bouncy), Obstacles (Crate, Fan), Speed Token, Finish Flag |
| **Levels / District** | 8 courses |
| **Session Target** | 1-3 min per course |
| **Platform Gap Range** | 1-4 platform widths |
| **Districts at Launch** | 3 |
| **Failure** | Yes — fall off screen |
| **Continue System** | Respawn at last safe platform (1 free retry per course) |
| **Star Rating** | 1-3 stars based on tokens collected |

---

## Core Mechanics

### Primary Input

**Input type:** Tap / Tap-and-hold
**Acts on:** The Runner character
**Produces:** A jump arc — short hop on quick tap (≤ 150 ms hold), long leap on hold (> 150 ms, up to 500 ms max)

All input is touch-first. On web, mouse-down / mouse-up maps directly to tap / tap-and-hold. No hover-dependent mechanics. No keyboard shortcuts required for gameplay.

### Play Surface

The play surface is a horizontally scrolling strip rendered in portrait orientation. The visible window is approximately 360 × 640 logical pixels (9:16). The camera follows the Runner horizontally at a fixed offset from the left edge (Runner sits at roughly 25% of the visible width). Vertical bounds are fixed: the Runner falls off-screen if their Y position exceeds the bottom edge. The top 80 px is reserved for the HUD (score/stars/timer); the bottom 0 px is the death plane.

Platform cells are 64 × 24 px visually; tap targets for the jump button area cover the full lower-half of the screen (≥ 44 × 44 pt).

### Game Entities

#### Runner
- **Visual:** Small courier character sprite, facing right, with run/jump/fall animation states.
- **Behavior:** Moves right at a constant scroll speed. Player cannot control horizontal speed.
- **Edge cases:** IF the Runner's bottom edge is below the bottom of the viewport for > 2 frames THEN trigger fall-death sequence.

#### Platform — Normal
- **Visual:** Solid grey concrete slab.
- **Behavior:** Static. Runner lands and runs on it.
- **Edge cases:** IF Runner walks off the right edge of the platform with no adjacent platform THEN Runner enters fall state.

#### Platform — Crumbling
- **Visual:** Fractured orange slab.
- **Behavior:** Supports Runner for 0.5 s then crumbles (plays crumble animation over 300 ms then disappears).
- **Edge cases:** IF Runner is still standing on the platform when it disappears THEN Runner enters fall state immediately.

#### Platform — Bouncy
- **Visual:** Green spring-coil slab.
- **Behavior:** On contact, launches Runner upward at 1.8× the standard jump apex height (animation 150 ms).
- **Edge cases:** IF Runner is already at jump apex height THEN bounce apex is capped at 1.8× standard apex (no stacking).

#### Obstacle — Crate
- **Visual:** Wooden crate sitting on a platform.
- **Behavior:** Static. IF Runner collides with a Crate THEN Runner is knocked back and fall-death triggers.
- **Edge cases:** Crates never appear within the first two platforms of a course (safe start zone).

#### Obstacle — Fan
- **Visual:** Industrial fan mounted on a platform edge.
- **Behavior:** Emits a wind cone 96 px wide, 64 px tall. IF Runner enters the wind cone during a jump THEN horizontal momentum is reduced by 30% for the duration inside the cone.
- **Edge cases:** Fan wind cone is visualised as a translucent VFX overlay; its collision volume matches the visual.

#### Speed Token
- **Visual:** Glowing yellow coin floating 40 px above platform surfaces.
- **Behavior:** IF Runner overlaps the token hitbox (32 × 32 px) THEN token is collected, +10 score, brief pop animation (120 ms).
- **Edge cases:** Tokens never float over a gap — always over a valid platform surface.

#### Finish Flag
- **Visual:** Chequered flag pole at the far-right end of the course.
- **Behavior:** IF Runner reaches the Finish Flag THEN course-complete sequence triggers.
- **Edge cases:** Finish Flag is always placed on a Normal platform that is at least 3 platform-widths wide (guaranteed safe landing).

### Movement & Physics Rules

1. IF the player taps (hold ≤ 150 ms) THEN Runner performs a short hop: apex 96 px, arc duration 400 ms (200 ms up, 200 ms down).
2. IF the player holds (hold 151-500 ms) THEN jump apex scales linearly from 96 px to 160 px; arc duration scales from 400 ms to 600 ms.
3. IF the player releases hold after 500 ms THEN jump behaves as if hold was exactly 500 ms (no additional gain).
4. IF Runner is already airborne THEN additional tap input is ignored (no double-jump).
5. IF Runner lands on a Normal or Crumbling platform THEN vertical velocity resets to 0 and run state resumes.
6. IF Runner lands on a Bouncy platform THEN bounce apex applies (see Bouncy Platform entity).
7. IF Runner is inside a Fan wind cone THEN horizontal momentum is reduced by 30%; momentum restores instantly on exit.
8. Gravity is constant: 9.8 × 64 px/s² (pixels per second squared). Applied every frame.
9. Runner horizontal scroll speed: constant 180 px/s. Cannot be changed by the player.

> For invalid action feedback (visual, audio, duration), see [Feedback & Juice](#feedback--juice).

---

## Level Generation

### Method

**Hybrid** — Courses 1-2 per district are hand-crafted (tutorial exposure to each new entity type). Courses 3-8 are procedurally generated using a seeded algorithm.

### Generation Algorithm

**Step 1: Seed Initialization**
- Inputs: `districtIndex` (0-based), `courseIndex` (0-based)
- Outputs: A 32-bit integer seed
- Constraints: `seed = (districtIndex * 1000 + courseIndex) * 48271`. Same inputs always produce the same seed.

**Step 2: Difficulty Parameter Derivation**
- Inputs: Seed, `globalLevel` (= districtIndex × 8 + courseIndex, 0-based)
- Outputs: `gapRangeMax` (1-4), `obstacleChance` (0.0-0.35), `crumblingChance` (0.0-0.2), `bouncyChance` (0.0-0.1), `tokenDensity` (0.3-0.7)
- Constraints:
  - Levels 0-7: `gapRangeMax` = 2, `obstacleChance` = 0.05, `crumblingChance` = 0.0, `bouncyChance` = 0.0
  - Levels 8-15: `gapRangeMax` = 3, `obstacleChance` = 0.15, `crumblingChance` = 0.1, `bouncyChance` = 0.05
  - Levels 16+: `gapRangeMax` = 4, `obstacleChance` = 0.25, `crumblingChance` = 0.2, `bouncyChance` = 0.1
  - Parameters scale linearly within each band; no sudden jumps.

**Step 3: Platform Sequence Generation**
- Inputs: Seed-derived RNG, difficulty parameters, course length target (24 platforms)
- Outputs: Ordered list of `{platformType, width, gapBefore}` structs
- Constraints:
  - First platform: Normal, width ≥ 3 cells, gap = 0 (start platform, always safe)
  - Last platform: Normal, width ≥ 3 cells (finish platform, always safe)
  - No two Crumbling platforms in a row
  - No Bouncy platform immediately before a gap larger than 2 cells
  - `gapBefore` is sampled uniformly from [1, gapRangeMax] cells

**Step 4: Obstacle Placement**
- Inputs: Platform list, RNG, obstacleChance
- Outputs: Per-platform obstacle assignment (none / Crate / Fan)
- Constraints:
  - No obstacle on the first 2 platforms or the last platform
  - No obstacle on a Crumbling or Bouncy platform
  - Maximum 1 obstacle per platform
  - Obstacle is placed at the right 25% of the platform surface (player always approaches from left)

**Step 5: Token Placement**
- Inputs: Platform list, obstacle assignments, RNG, tokenDensity
- Outputs: Token positions (one token per eligible platform, placed at center)
- Constraints:
  - Tokens only placed on platforms that have no obstacle
  - Token density = fraction of eligible platforms that receive a token
  - No token on the last platform (prevent player rushing finish flag)

**Step 6: Solvability Validation**
- Inputs: Generated course
- Outputs: Pass / Fail flag
- Constraints (rejection conditions):
  - Any gap wider than `maxJumpDistance` at full hold (calculated from physics: `max_gap = scroll_speed × arc_duration_max = 180 × 0.6 = 108 px ≈ 1.7 platform widths`; so gap of 2 cells at 64 px/cell = 128 px triggers rejection if Runner cannot bridge it)
  - More than 3 consecutive Crumbling platforms (edge case guard)
  - Course total length < 20 platforms (generator error guard)

### Seeding & Reproducibility

Seed formula: `seed = (districtIndex * 1000 + courseIndex) * 48271`

The same seed always produces the same course. The RNG is a deterministic LCG (`next = (seed × 1664525 + 1013904223) mod 2^32`). No `Math.random()` is used anywhere in generation. RNG state is a closure variable, not stored in ECS.

**Failed seed handling:** If a seed produces a rejected course, increment the seed by 1 and retry. After 10 retries, use the last-resort fallback.

### Solvability Validation

**Rejection conditions (named):**
1. `GAP_TOO_WIDE` — any gap exceeds bridgeable distance at max hold jump
2. `TOO_MANY_CONSECUTIVE_CRUMBLING` — 3+ Crumbling platforms in a row
3. `COURSE_TOO_SHORT` — fewer than 20 platforms generated

**Retry logic:** Up to 10 attempts with incremented seeds.

**Fallback chain:** If all 10 attempts fail, use the hand-crafted fallback course for that district (stored as a static JSON fixture).

**Last-resort guarantee:** Every district has one static hand-crafted course that always passes validation. This course is always solvable; it is used when generation fails. It cannot fail.

### Hand-Crafted Levels

- **Which levels:** Courses 1-2 of each district (indices 0 and 1 within the district), plus each district's fallback course.
- **Where data lives:** `src/game/platformrush/data/courses/{districtId}/course-{index}.json`
- **Who owns them:** Game designer (level data files); developer (JSON schema + loader).

---

## Game Flow

### Master Flow Diagram

```
App Open
  ↓ (asset load complete)
Title Screen  [lifecycle: TITLE]
  ↓ (player taps "Play")
District Map  [lifecycle: PROGRESSION]
  ↓ (player taps a course node)
Course Start Interstitial  [lifecycle: TITLE]
  ↓ (auto-advance after 1.5 s)
Gameplay Screen  [lifecycle: PLAY]
  ↓ (Runner reaches Finish Flag)         ↓ (Runner falls off screen)
Course Complete Screen [OUTCOME]       Loss Screen [OUTCOME]
  ↓ (taps "Continue")                    ↓ (taps "Try Again" — 1 free)
District Map  [PROGRESSION]            Gameplay Screen [PLAY]  (or District Map if retries exhausted)
  ↓ (all 8 courses complete)
District Complete Screen  [OUTCOME]
  ↓ (taps "Next District")
District Map (next district unlocked)  [PROGRESSION]
```

### Screen Breakdown

#### Title Screen
- **lifecycle_phase:** TITLE
- **Purpose:** Entry point; communicates brand and starts player journey.
- **Player sees:** Game logo, "Play" button, city skyline background.
- **Player does:** Taps "Play."
- **What happens next:** District Map screen.
- **Expected session time:** < 5 s.

#### District Map
- **lifecycle_phase:** PROGRESSION
- **Purpose:** Let the player choose which course to attempt; shows progress.
- **Player sees:** Stylised map of the district skyline; course nodes (locked/unlocked/complete); star counts per node.
- **Player does:** Taps an unlocked course node.
- **What happens next:** Course Start Interstitial.
- **Expected session time:** 10-20 s.

#### Course Start Interstitial
- **lifecycle_phase:** TITLE
- **Purpose:** Transition frame; names the course and sets pace.
- **Player sees:** District name, course number, brief descriptor (e.g., "District 1 · Course 3 — Neon Rooftops").
- **Player does:** Nothing (auto-advances after 1.5 s) or taps to skip.
- **What happens next:** Gameplay Screen.
- **Expected session time:** 1.5 s.

#### Gameplay Screen
- **lifecycle_phase:** PLAY
- **Purpose:** Core experience — run, jump, collect.
- **Player sees:** Scrolling rooftop course, Runner, platforms, obstacles, tokens, HUD (score / stars / course progress bar).
- **Player does:** Taps / holds to jump.
- **What happens next:** Course Complete Screen (win) or Loss Screen (fall).
- **Expected session time:** 1-3 min.

#### Course Complete Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Celebrate success; show earned stars; reinforce progress.
- **Player sees:** Star rating (1-3), tokens collected count, "Continue" button.
- **Player does:** Taps "Continue."
- **What happens next:** District Map (next course unlocked).
- **Expected session time:** 5-10 s.

#### Loss Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Gentle recovery; encourage retry without punishing.
- **Player sees:** "Nice try!" message, tokens collected so far, "Try Again" button (active if retry available), "District Map" button.
- **Player does:** Taps "Try Again" (respawns at last safe platform) or "District Map."
- **What happens next:** Gameplay Screen (retry) or District Map.
- **Expected session time:** 5 s.
- **Note:** Avoid "Game Over" language. The retry is framed as continuation, not restart.

#### District Complete Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Celebrate finishing a district; unlock the next.
- **Player sees:** District name, total stars collected, "Next District" button, skyline art.
- **Player does:** Taps "Next District."
- **What happens next:** District Map (next district, first course unlocked).
- **Expected session time:** 5-10 s.

### Board States

| State | Description | Input Allowed? |
|---|---|---|
| `IDLE` | Runner on a platform, awaiting jump input | Yes — tap/hold |
| `AIRBORNE` | Runner in jump arc | No — additional tap ignored |
| `LANDING` | Runner touching down (≤ 2 frames) | No |
| `BOUNCING` | Runner launching off Bouncy platform (150 ms animation) | No |
| `WON` | Runner has reached Finish Flag | No |
| `FALLING` | Runner below bottom viewport edge | No |
| `PAUSED` | Game paused via HUD button | No — except unpause button |

Any transition that mutates visible platform state (crumble, bounce launch, token collect) is an animated transition — no instant state change. Crumble animation: 300 ms. Bounce launch: 150 ms. Token collect pop: 120 ms.

### Win Condition

`IF Runner.x >= FinishFlag.x AND Runner.isGrounded THEN state = WON`

### Lose Condition

`IF Runner.y > viewport.height + 32 THEN state = FALLING → triggerLossSequence()`

### Win Sequence (ordered)

1. Board state transitions to `WON`.
2. Runner plays "victory" animation (arms raised, 400 ms).
3. Screen freezes horizontal scroll.
4. Star rating calculated: 1 star = any finish, 2 stars = ≥ 50% tokens, 3 stars = ≥ 90% tokens.
5. "Course Complete" jingle plays.
6. Course Complete Screen fades in (300 ms cross-dissolve).
7. Stars animate onto the screen one-by-one (150 ms each, staggered 100 ms apart).
8. "Continue" button appears (fade in, 200 ms).

### Loss Sequence (ordered)

1. Board state transitions to `FALLING`.
2. Runner plays "fall" animation.
3. Screen fades to dark (400 ms).
4. Loss Screen fades in (300 ms).
5. Tokens-collected count displayed with a roll-up counter animation (500 ms).
6. "Try Again" button appears if retry is available; otherwise only "District Map" button.
