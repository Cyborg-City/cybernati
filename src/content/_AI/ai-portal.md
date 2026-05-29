# Cybernati AI Agent Portal

Welcome, AI agent! This is the primary orientation note for **Cybernati**, a personal knowledge base (PKM) and blog vault designed by the user. It is published to GitHub Pages using Astro (Astro Modular theme).

> [!TIP]
> **Vault Progress & Status**: Check the **[agent-roadmap.md](agent-roadmap.md)** to see active tasks, completed milestones, solidified design decisions, and future roadmap phases!

---

> [!IMPORTANT]
> **Cardinal Rule for Content Authorization:**
> - Content folders (`posts/`, `pages/`, `projects/`, `docs/`, and `special/`) are **strictly off-limits** for direct edits unless you have explicit permission from the user.
> - You are **fully authorized** to manage, run, and configure files inside `_AI/`, `_Internet-Archive/`, and the collaborative drafting directory `_writers-room/`. Use `_writers-room/` to draft and write collaboratively with the user!

---

## 📂 Vault Directory Map

Here is an overview of how this vault is structured:

### Content Folders (User Only)

| Folder | Purpose |
|--------|---------|
| `posts/` | Blog posts published to the live site. |
| `pages/` | Static pages like About, Contact, or other custom standalone pages. |
| `projects/` | Project notes detailing active/completed personal projects. |
| `docs/` | Documentation notes, guides, and reference material. |
| `special/` | Core site pages with fixed URLs (e.g., Homepage, 404, specific category listings). |

### System & Workflow Folders (Agent-Authorized & Collaborative)

| Folder | Purpose |
|--------|---------|
| `_AI/` | AI configurations, specialized skills, brainstorm drafts. This directory. |
| `_AI/issues/` | Task & bug tracking. Use the `0000-issue.md` template for new entries. Codebase agents read and execute these independently. |
| `_AI/guides/` | Agent runbook — procedural guides for tools, extensions, and workflows. See [guide-TOC.md](guides/guide-TOC.md) for the full catalog. |
| `_Internet-Archive/` | UAP documents, IA item notes, logs, and upload scripts. |
| `_writers-room/` | Collaborative drafting with the user. Your drafts are gitignored; clean commits. |
| `_private/` | Shared collaboration files. **Not published** to the live site. |
| `bases/` | Obsidian `.base` reference files — a central dashboard inside Obsidian. |
| `.obsidian/` | Real vault config, plugins, settings. Acts as **headless CMS** — changes here affect Astro rendering (wikilinks, callouts, frontmatter). |
| `_Clippings/` | Obsidian Web Clipper storage for captured research notes. |

---

## 🛠️ AI Toolbox & Skills Catalog

Agents have access to two types of skills to help automate workflows in this vault.

### Built-In Tools (Pi Agent Only)
These are not skills — they are built-in capabilities of the **Pi coding agent**. Other agents (Claude Code, Cursor, etc.) do not have access to these.

- **`schedule` / `schedules` / `cancel_schedule`**: Enables async workflows — fire a long command, set a timer, end your turn, and get pinged when it's time to check. See the [Schedule Tool Guide](_AI/guides/tools/schedule/how-to-use.md) for syntax, strategies, and patterns.

### Global Workspace Skills (Environment)
These skills reside in the workspace configuration (`.agents/skills/`) and assist with general system/tool integration:
- **`obsidian-cli`** (`.agents/skills/obsidian-cli/`): The interface to interact directly with the Obsidian vault. Use this to read/write notes, search properties, list tags, manage daily notes, etc.
- **`internet_archive (ia)`** (`.agents/skills/internet_archive/`): Interact programmatically with `archive.org` via the `ia` CLI tool to search, download, or manage historical collections.

### Vault-Specific Workflow Skills
These skills reside inside the vault itself (`_AI/skills/`) and are custom-tailored to Cybernati's data tasks:
- **`PURSUE`** (`_AI/skills/PURSUE/`): Process, sort, catalog, and initiate uploads for declassified UAP document releases from the Department of War / AARO under the PURSUE Act. Sets up the configuration notes required for the bulletproof upload scripts.
- **`process-clippings`** (`_AI/skills/process-clippings/`): Ingest, sort, and analyze web clippings captured via the Obsidian Web Clipper. Organizes clippings inside a collaborative `_writers-room/` workspace and generates a standardized `agent-report.md` for co-authoring.
- **`4mat`** (`_AI/skills/4mat/`): Use the 4MAT Framework (Why, What, How, What If) to simplify and teach ideas. Write accessible content, explain complex topics, or structure lessons and presentations that engage all learning styles. Based on Dr. Bernice McCarthy's instructional design model.

---

## 📜 Agent Guidelines & Context

- **Vault-Scope Boundary**: Never perform any action or make edits to files outside the vault directory (`src/content/`) unless explicitly and directly requested by the user. This is critical to protect the Astro workspace code and prevent regression.
- **Obsidian Settings & Plugins Security**: Never modify files in `.obsidian/` (including plugins, themes, and configuration files). Astro's build parser relies on the specific Obsidian setup, and altering these files can break how pages are rendered or built on the live site.
- **Link Integrity**: Ensure all internal links in content use standard Markdown or Obsidian wikilinks (`[[Note Name]]`) correctly to maintain compatibility between the live Astro site and Obsidian.
- **Issue Tracking Workflow (Separation of Concerns)**: Keep site code development strictly separate from vault research and writing. If you identify a codebase feature request, styling issue, layout adjustment, or bug, **do NOT edit codebase files**. Instead, log a descriptive issue note inside the `_AI/issues/` directory using the `0000-issue.md` template. This allows designated developer agents to review, plan, and execute those codebase modifications safely.
- Always consult both the vault-level `AGENTS.md` and the root-level `AGENTS.md` for full context on boundaries, Tailwind variables, and Astro instructions.

