# Agent Roadmap & Vault Progress

This note is the living record of completed tasks, active work, and future plans for Cybernati's AI integrations and content workflows. Agents must consult this note before beginning work and update it as progress is made.

---

## 📌 Active Focus
* **Current Task**: Completed massive media player global refactoring, cross-collection graph connection fixes, and centralized cover image path resolution utility.
* **Next**: Proceeding with the Chronos timeline integration or satellite dossiers (Kenneth Arnold, Roswell, Bob Lazar).

---

## 📜 Solidified Decisions
A historical record of architectural and workflow decisions to prevent backsliding:

### May 2026
* **Blog Post Voice Options**: Nick Redfern-style (conversational, wry, campfire-storyteller) is available as a voice for oddity/weird-history pieces, but is not the default. Agents should ask before applying any specific voice.
* **Blog Post + Dossier Split**: Decided that the historical 130-year arc (airships → PURSUE) lives in the blog post, while the dossier is strictly PURSUE-focused — a living reference that grows with each tranche. Satellite dossiers (Kenneth Arnold, Roswell, Lazar) planned for later.
* **PURSUE Naming Confirmation**: Confirmed via war.gov that the official name is "Presidential Unsealing and Reporting System for UAP Encounters (PURSUE)" — a Presidential executive initiative, not an Act of Congress. Dossier titled "The Project PURSUE Reference Dossier."
* **Vault-Root AGENTS.md**: Relocated `AGENTS.md` from the hidden `.agents/` folder to `src/content/AGENTS.md` to make it visible in the Obsidian sidebar.
* **Standardized Ingestion Report**: Agreed on a unified filename (`agent-report.md`) placed inside the collaborative `_writers-room/{working-title-dir}/` workspace to store source summaries, entity maps, and vault connections.
* **Ingestion-Only Rationale**: Agreed to limit the initial clipping workflow to ingestion and source analysis, leaving final synthesis open-ended to support planned Astro content types (dossiers, atomic notes, wikis).
* **Clippings Git Policy**: Configured `_Clippings/` to support both `shared/` (fully tracked/committed clippings) and `archived/` (folder tracked, files git-ignored).
* **Interactive CLI Ingestion**: Refined the clippings workflow to process files strictly one-at-a-time, allowing interactive review and co-author discussion between reports. Programmed the agent to leverage the `obsidian-cli` skill for vault-searching and note-reading where appropriate.
* **Refined Collection Architecture**: Aligned on the directory layout and build rules for the new collection types:
  * **Dossiers (`dossiers/`)**: Folder-based collection; all internal files (annexes, sub-briefings) are compiled publicly by Astro (`**/*.{md,mdx}`).
  * **Wiki Pages (`wiki/`)**: Folder-based collection; supports colocated assets and multiple public files. Mapped to `wiki_category` database key in the backend, completely separated from frontend presentation labels.
  * **Atomic Notes (`atomic/`)**: File-based/Flat collection; standalone slips for evergreen, modular concepts.
* **Zero-Maintenance Backlinks**: Backlinks and conceptual networks will be parsed programmatically at Astro build-time from inline markdown wikilinks, keeping frontmatter properties extremely clean and low-maintenance.
* **Global Persistent DOM Player Architecture**: Shifted the media player from a sandboxed `<iframe>` to a top-level parent DOM component in `BaseLayout.astro`. Leveraged absolute positioning, GPU composite layers (`will-change`), and Swup transition event hooks to completely prevent audio duplicate overlaps and page loading freezes.
* **Strict Opt-In PiP & Lazy-Loading**: Enforced strict opt-in Picture-in-Picture windowing to eliminate background ghost audio leaks, and lazily load the external YouTube Iframe Player API script only when a video slot is actively requested or restored.
* **Proportional Multi-Edge Aspect-Locked Resizer**: Created an 8-boundary invisible resizing container for the PiP player that locks a `16:9` aspect ratio, caches customized dimensions in `localStorage`, and handles responsive docking seamlessly.
* **Micro-Smooth Audio Fades via requestAnimationFrame**: Replaced standard `setInterval` fade loops with modern recursive `requestAnimationFrame` routines to sync audio adjustments precisely with display monitor Hz and pause CPU thread execution on inactive tabs.
* **FOUC Swup Prevention**: Configured Astro Swup integration with `awaitAssets: true` and `persistAssets: true` to prevent unstyled text flashes and maintain active styling states during client-side transitions.
* **Centralized Cover Image Resolution**: Refactored the custom YAML array extraction, double-bracket stripping, subfolder path falls, and WebP format matching into a single centralized `resolveCoverImage` utility in `src/utils/images.ts` covered by green TDD unit tests.
* **Cross-Collection Graph Connections**: Fixed the graph generation script (`generate-graph-data.js`) to strip all collection-specific prefixes (`posts/`, `dossier/`, `vault/`), restoring cross-collection linkages between different content sections.

---

## 🛠️ Completed Milestones
* [x] Create Vault Orientation Portal (`_AI/ai-portal.md`).
* [x] Move and update vault-root `AGENTS.md`.
* [x] Track `_writers-room/` with Git while ignoring its contents.
* [x] Initialize `_Clippings/` layout (with Git-ignored `archived/` and fully tracked `shared/`).
* [x] Store the standardized template at `process-clippings/resources/agent-report-template.md`.
* [x] Write the rigid, step-by-step agent instructions in `process-clippings/SKILL.md`.
* [x] Link both the `process-clippings` skill and the progress roadmap in `_AI/ai-portal.md`.
* [x] Create the active issue-tracking system (`_AI/issues/`) and standardized `0000-issue.md` template.
* [x] Document the Issue Tracking workflow inside the main `_AI/ai-portal.md` portal.
* [x] Ingest all 6 targeted UAP history clippings sequentially into `_writers-room/uap-historical-timeline/agent-report.md`.
* [x] Co-author the first deep-dive research timeline draft (`draft-secrets-to-unsealing.md`) using metadata-styled Mermaid timeline scales and phase-by-phase bullet points.
* [x] Refine and establish the technical specification issue ticket for new Astro Content Collections (`_AI/issues/0001-add-astro-collections.md`).
* [x] Establish the technical specification issue ticket for the Chronos timeline integration (`_AI/issues/0002-integrate-chronos-timeline.md`).
* [x] Ingest 4 Aurora Texas clippings into `_writers-room/aurora-texas-1897/` and distill `common-ground.md`.
* [x] Create 4MAT-structured vault entity `vault/the-aurora-texas-incident/` and conversational post `posts/theres-an-alien-grave-in-texas-and-nobody-can-dig-it-up/`.
* [x] Build and integrate new Astro Content Collections (Vault, Dossier, Media) with full schemas, listing pages, and API routes.
* [x] Architect and implement the Global Persistent DOM Media Player (`CybernatiPlayer.astro`) with aspect-locked multi-edge resizer, Related Notes slide-up menu, customized SVG pulse loaders, Giscus panel, keyboard hotkeys, and passive composite event listeners.
* [x] Develop a centralized `resolveCoverImage` utility and refactor all listing cards and layouts under 100% green TDD specs.
* [x] Refactor the graph generation pipeline (`generate-graph-data.js`) to support dynamic cross-collection mapping and restore 9 lost connections.

---

## 🚀 Future Roadmap & Planned Skills

### Phase 2: In-Vault Writing & Synthesis (Nearing Completion)
* [x] **Draft Synthesis Workflow**: Establish collaborative outlining and narrative deep-dives in the `_writers-room/uap-historical-timeline/` folder.
* [x] **Aurora Texas Clippings Processed**: Ingested 4 clippings into `_writers-room/aurora-texas-1897/` — Ancient Aliens clip, Jim Marrs documentary, Wikipedia article, UFO Files episode. Full source-by-source analysis in `agent-report.md`.
* [x] **Common Ground Distilled**: Created `common-ground.md` — all facts the four sources agree on, separated from disputed claims.
* [x] **Vault Entity Written**: `vault/the-aurora-texas-incident/` — factual deep-dive reference, 4MAT-structured (Why → What → How → What If), evidence-focused.
* [x] **Blog Post Drafted**: `posts/theres-an-alien-grave-in-texas-and-nobody-can-dig-it-up/` — short 3-min read in Redfern voice, campfire-story tone, images added by user.
* [x] **Cross-Linked Both Articles**: Blog post links to vault entity on "April 19, 1897". Vault entity links to blog post on "unmarked grave". Natural existing-text anchors, no new sentences.
* [x] **Schedule Tool Guide Expanded**: Added async strategies section to `_AI/guides/tools/schedule/how-to-use.md` with 6 patterns (fire-and-check, staggered timers, daisy chain, batched checkpoint, progressive polling, error pre-flight). Documented the 30s×3 → 1m×3 → 2m×3 → 5m ladder.
* [x] **Schedule Tool Documented in AGENTS.md**: Added section 5 to `src/content/AGENTS.md` explaining the tool, marked as Pi-only. Updated `ai-portal.md` with built-in tools header.
* [ ] **Automatic Backlinks Parser**: Develop local Obsidian Dataview templates or script helpers to display dynamic connections natively in Obsidian before building them in Astro.

### Phase 3: Astro Integration & Publishing
* [x] **Astro Content Collections (Issue 0001)**: Dossier, Vault, and Media collections implemented with schemas, routes, and listing pages. [Closed 2026-05-28]
* [x] **Publish Workflow**: Blog post + dossier published. Blog post at `posts/from-classified-to-curated-project-pursue/`. Dossier at `content/dossier/the-project-pursue-reference-dossier/`. [Published 2026-05-28]
* [ ] **Build-Time Backlink Engine**: Write the markdown processor that dynamically extracts wikilinks from note bodies and injects backlink portals at page footers automatically.
* [ ] **Chronos Timeline Integration (Issue 0002)**: Add a Remark/Rehype compiler plugin to parse Obsidian `chronos` codeblocks and render them as native, responsive HTML/CSS timelines.
* ⏸️ **Media Player Integration (Issue 0003)**: Component and path resolver done; MDX registration and validation deferred for polish. [Pinned 2026-05-28]
* [ ] **Transition-to-Publish Agent Skill**: Code the automation to prompt for frontmatter validation and transfer sandbox drafts to live-site collections.

---

## 🔜 Next Session (2026-05-30+)

1. **Chronos Timeline Integration** — Design and implement a Remark parser plugin to translate Obsidian `chronos` timelines into responsive CSS elements.
2. **Build-Time Backlink Engine** — Develop a markdown processor that extracts wikilinks from note bodies at build-time to dynamically render backlink portals in note footers.
3. **Satellite UAP Dossiers** — Kenneth Arnold, Roswell, Bob Lazar — same pipeline: clippings → common-ground → vault entity → blog post.
