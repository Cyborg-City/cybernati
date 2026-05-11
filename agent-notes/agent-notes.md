# Agent Notes

---

## Backlog

*Nothing in backlog.*

---

## Doing

*Nothing currently in progress.*

---

## Done

### Slit Experiment Sequence

- **2026-05-11 /ingest**: Extracted 3 sources from `Clippings/slit experiement/` (MIT complementarity, Steinberg negative time, PBS quantum eraser). Drafted 13 entity files in `Clippings/INGEST-20260511-Slit-Experiment/`. Wrote `report.md` with three-lens analysis (Factual, Institutional, Systemic).
- **2026-05-11 Tactical Alignment**: User elected to SKIP /research — evidence is ubiquitous. Priority is flavor/synthesis only.
- **2026-05-11 /synthesize**: Drafted `DOS-TEMP-slit-experiment.md` using 4MAT structure + Timeline. Extracted "The Clerk's Assessment" into separate `MEM-TEMP-slit-experiment.md`.
- **Pruning**: Removed dedicated `TEMP-pbs-quantum-eraser.md` evidence note per user request. Replaced dead wikilink in `TEMP-mithina-looking-glass.md` with direct YouTube URL.
- **Refinement (2026-05-11)**: User approved dropping 4 thin entities (MIT org, U of T org, Mithina person, MIT PRL evidence). Dossier rewritten with TL;DR, compressed Timeline (8 entries), tight WHAT paragraphs, render-engine HOW bullets, consolidated WHAT IF (2 questions). Cut ~40% of prose.
- **Memo closing line (2026-05-11)**: User replaced "The System is performing as intended." in `MEM-TEMP-slit-experiment.md` themselves. Task resolved.
- **Citation enrichment (2026-05-11)**: Used agent-browser skill to find outside sources. Added 6 new citations to Dossier: MIT News article, Steinberg arXiv paper (2010.02200), Kim et al. original quantum eraser paper (quant-ph/9903047), Nature Physics time-double-slit article, Sean Carroll blog post, Feynman Lectures Chapter 1. Organized into Primary Literature / Expert Commentary / Video Sources sections.
- **/finalize (2026-05-11)**: Merged 10 files into vault content/. IDs assigned: PER-0002→0005, EVT-0002→0005, DOS-0002, MEM-0002. 4 entities pruned. 3 images moved to content/Dossiers/. Draft status set false. Wikilinks refactored. Staging folder deleted.

### System Configuration

- **2026-05-11**: User added "Agent Notes Protocol" to GEMINI.md — mandates pro-active reading/updating of `agent-notes/agent-notes.md` with Backlog, Doing, Done, and Thoughts & Learnings sections. Note: I previously confused `agent-log.md` with `agent-notes.md`. These are two separate files. The log tracks lifecycle sequences. The note file tracks tactical state.

### Roanoke Sequence (Prior Session)

- **FINALIZED**: EVD-0001, PER-0001, ORG-0001, CLM-0001, CLM-0002, PAT-0001, DOS-0001 merged into vault `content/`.

---

## Thoughts & Learnings

- The user drives the tone. When they said "skip research, I want flavor," I should listen. Not every sequence needs /research — some signals are already well-sourced.
- The distinction between flavor-only directories (Dossiers, Internal Memos) vs. serious/functional (Evidence, People, Events, etc.) is important to maintain. The Dossier should synthesize but not drift into speculation that belongs in the Memo.
- **CRITICAL**: `agent-log.md` and `agent-notes.md` are two separate files. `agent-log.md` tracks the staged sequence lifecycle. `agent-notes.md` tracks Backlog/Doing/Done/Thoughts. I confused these — user corrected me.
- The Obsidian CLI skill at `.gemini/SKILLS/obsidian-cli/SKILL.md` is flagged as mandatory in GEMINI.md but I have not been using it — I have been using direct file reads. Future task: refamiliarize with the skill and use it for vault operations going forward.
- Quantum mechanics flavor angle: "lazy rendering" and "measurement as compile step" are strong metaphors. The user responded well to this framing.
- The Quartz dev server question (2026-05-11) — user resolved it themselves. I was unfamiliar with the Quartz CLI flags. Different static site generators have different dev commands.
  - **User-corrected**: The correct Quartz dev server command is **`npx quartz build --serve`**. Do not use `npx quartz dev` — it is not a valid Quartz CLI command.