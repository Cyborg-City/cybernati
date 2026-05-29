# Cybernati — Vault AI Guidelines

This is the vault-level configuration and guideline directory for AI agents working within `src/content/`.

> [!IMPORTANT]
> **Vault-Scope Boundary**: When working within this vault directory (`src/content/`), agents must follow **this vault-level `AGENTS.md`** file, NOT the `AGENTS.md` file in the parent folder (which is reserved for Astro Modular theme/codebase development). 

---

## 🧭 Getting Oriented & AI Portal

The **[AI Portal](_AI/ai-portal.md)** is the living source of truth for all workflows, directory maps, skills, and current objectives in this vault.

1. **Read First**: Before starting any tasks in this vault, you must read the primary AI orientation note at **[AI Portal](_AI/ai-portal.md)** to orient yourself.
2. **Active Maintenance Required**: Whenever you make a significant change, introduce a new feature, add a specialized vault skill, restructure files, or discover an extremely helpful workflow, **you must immediately update the AI Portal** to reflect these changes. This ensures that future agent sessions can seamlessly pick up where you left off, stay oriented to the latest vault state, and avoid breaking custom guidelines or working with outdated info.

---

## 🛠️ Interacting with the Vault

### 1. Command-Line (CLI) Standards
- **Prefer the `obsidian-cli` Skill**: When reading, searching, or managing notes in this vault, you should **always use the specialized `obsidian-cli` skill** (`.agents/skills/obsidian-cli/`). Using the Obsidian CLI is much better for keeping the agent and user in sync and provides advanced tools and contextual feedback.
- **File Creation & Templates**: The Obsidian CLI **does support file creation** via `obsidian create path=<path> content=<text>` and can apply templates using the `template=<template_name>` flag.
- **When to Bypass the CLI**: Standard terminal shell-interpolation rules apply to CLI execution. 
  - If note content contains **backticks (code blocks)**, **shell variables (like `$`)**, or complex markdown, **do NOT use `obsidian create` or `obsidian append`** as the shell will corrupt the syntax.
  - For complex content, or for making precise line-by-line edits (as opposed to overwriting a file completely), bypass the CLI and use the standard Write/Edit tools directly.

### 2. Path & Link Standards
- **Use Relative Paths**: When writing documentation, scripts, or instructions for the user (or other agents), **never hardcode absolute paths** (like `C:\...` or `E:\...`). Always use placeholders (e.g., `{Absolute path to...}`) or use paths relative to the vault root (`src/content/`). This ensures the vault remains fully portable across different machines and operating systems.
- **Standard Markdown Links vs. Wikilinks**: For system/filesystem navigation and readability by AI agents, **always prefer standard relative markdown links** (e.g., `[Portal](_AI/ai-portal.md)`) over Wikilinks (e.g., `[[_AI/ai-portal|ai-portal.md]]`). Standard markdown links are much easier for agents to parse and navigate because they specify the exact relative path on the filesystem, allowing agents to use file-viewing tools directly without needing slow search/indexing routines to resolve references. Wikilinks are still encouraged for Obsidian-native notes visible to the user, but system/agent documentation must use standard relative links.
- **Writing to `_AI/` Directory**: When creating or editing any files inside the `_AI/` directory (such as the AI Portal, skills, workflow guides, and instructions), **you must exclusively use standard relative markdown links and relative paths**. Never use Wikilinks or hardcoded absolute paths within this directory.

### 3. Scripting Standards
- **Explain Your Code**: When writing scripts, leave clear comments explaining the *why* of the code you wrote to aid collaboration and future agent comprehension.

### 4. Logging Standard
- **Logging is mandatory.** Every tool or script that executes code MUST write a JSONL log entry at minimum when it runs.
- Log file lives at `<script-dir>/logs/<tool-name>.jsonl`.
- Every entry requires: `ts` (ISO timestamp), `level` (info/warn/error), `tool` (name), `msg` (human-readable summary).
- Install logging first, logic second. See the [logging standard guide](_AI/guides/rules/logging-standard.md) for the full spec.

### 5. Schedule Tool (Pi Agent Only)

> **Applies to: Pi coding agent only.** Other agents (Claude Code, Cursor, etc.) do not have this tool.

The **schedule tool** is a Pi-exclusive feature that enables async workflows. Pi can fire off a long-running bash command, set a timer, end its turn, and come back when the timer fires — no busy-waiting or polling loops needed.

**How Pi uses it:**

1. Pi runs a long command with `bash` (e.g., `ia upload`, `pnpm build`).
2. Pi calls `schedule(duration, note)` — sets a timer for N seconds/minutes.
3. Pi ends its turn. Timer runs in the background.
4. Timer fires — Pi gets pinged with the note it left itself and picks up where it left off.

**Why it matters for this vault:** Large operations like uploading Internet Archive items, generating graph data, or running site builds can take minutes. With the schedule tool, Pi can kick these off and do other work (or wait quietly) instead of blocking.

**Key tools:** `schedule()`, `schedules()`, `cancel_schedule()`

See the [Schedule Tool Guide](_AI/guides/tools/schedule/how-to-use.md) for full documentation, syntax, and async strategies.
