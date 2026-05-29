# Agent Roadmap & Vault Progress

This note is the living record of completed tasks, active work, and future plans for Cybernati's AI integrations and content workflows. Agents must consult this note before beginning work and update it as progress is made.

---

## 📌 Active Focus
* **Current Task**: Planning and building the async command runner (Issue 0004). Workspace created at `_AI/async-command-runner/`.

---

## 📜 Solidified Decisions
A historical record of architectural and workflow decisions to prevent backsliding:

### May 2026
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

---

## 🚀 Future Roadmap & Planned Skills

### Phase 2: In-Vault Writing & Synthesis (Nearing Completion)
* [x] **Draft Synthesis Workflow**: Establish collaborative outlining and narrative deep-dives in the `_writers-room/uap-historical-timeline/` folder.
* [ ] **Automatic Backlinks Parser**: Develop local Obsidian Dataview templates or script helpers to display dynamic connections natively in Obsidian before building them in Astro.

### Phase 3: Astro Integration & Publishing
* [x] **Astro Content Collections (Issue 0001)**: Dossier, Vault, and Media collections implemented with schemas, routes, and listing pages. [Closed 2026-05-28]
* [x] **Publish Workflow**: Blog post + dossier published. Blog post at `posts/from-classified-to-curated-project-pursue/`. Dossier at `content/dossier/the-project-pursue-reference-dossier/`. [Published 2026-05-28]
* [ ] **Build-Time Backlink Engine**: Write the markdown processor that dynamically extracts wikilinks from note bodies and injects backlink portals at page footers automatically.
* [ ] **Chronos Timeline Integration (Issue 0002)**: Add a Remark/Rehype compiler plugin to parse Obsidian `chronos` codeblocks and render them as native, responsive HTML/CSS timelines.
* ⏸️ **Media Player Integration (Issue 0003)**: Component and path resolver done; MDX registration and validation deferred for polish. [Pinned 2026-05-28]
* [ ] **Transition-to-Publish Agent Skill**: Code the automation to prompt for frontmatter validation and transfer sandbox drafts to live-site collections.

---

## 🔜 Next Session (2026-05-28)

1. **Write & Publish 1 post + 1 dossier** — Actual writing and publishing to the live Astro site. Need to identify content and go through the publish workflow.
2. **Async Command Runner** (Issue [[0004-async-command-runner]]) — Secondary priority; build the `run_async` extension.
