---
created: 2026-05-10T11:09:45-05:00
modified: 2026-05-11T19:35:00-05:00
---
# Cybernati™ Player: Channel Zero

A terminal-based video multiplexer simulating a clandestine OTA (Over-The-Air) broadcast. It utilizes linear synchronization (Unix Epoch Modulo) to ensure all viewers are witnessing the same signal at the same absolute second.

## 1. Core Architecture (The Timeline)
- **Variable Playback**: Intelligence slots scale to the actual duration of the source material. Every video plays in full.
- **Standby Protocol**: Every transmission is followed by exactly 30 seconds of "RE-ALIGNING" (Silent Local Interstitials).
- **Global Sync**: `currentPos = now % totalLoopDuration`.

---

# Quartz Integration Plan (Directive for Pi Delegate)

**Objective**: Migrate the standalone `scripts/generate-playlist.mjs` into a native **Modular Quartz Emitter** plugin.

## 0. Design Principles (Non-Negotiable)
- **TDD (Test-Driven Development)**: No implementation code without a preceding failing test.
- **DRY & SOLID**: Single Responsibility modules; Interface-based design for provider expansion.
- **BEYONCÉ**: Ownership and Spectacle. We wrap external sources; we own the Z-index and visual "decay."
- **TSDOC & NARRATIVE**: 
  - Use **TSDoc style comments** for all functions and classes.
  - **Explain the "WHY"**: Comments must explain the architectural intent, not just the "How."

## 1. The Modular Blueprint
The Emitter must be broken into distinct, testable modules:

### A. `BaseParser` (SOLID)
- **Logic**: Parses `channel-0000.base` YAML into structured rules.

### B. `SourceProvider` (SOLID)
- Interface for multiple providers (YouTube, DVIDS, X).
- **`YouTubeProvider`**: Initial implementation for ID and Duration metadata.

### C. `TimelineEngine` (Pure Logic)
- **Logic**: Pure function to compute the loop sequence (Offsets + 30s Gaps).

### D. `LinkResolver` (Vault Integration)
- **Logic**: Resolves Wikilinks via `BuildCtx`.

## 2. Phase 0: The Testing Ground
Create `quartz/plugins/emitters/broadcast.test.ts`.
- **Framework**: Node.js native test runner (`tsx --test`).
- **MANDATORY**: Each module must be verified by a test before implementation.

## 3. Phase 1: The Integrated Emitter
Create `quartz/plugins/emitters/broadcast.ts`.
- Integrated Emitter orchestrating the modules to emit `static/video_playlist.json`.

---
*The System Is Performing as Intended.*
*Reference ID: CN-PL-MOD-02*
