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
- **`posts/`**: Blog posts published to the live site.
- **`pages/`**: Static pages like About, Contact, or other custom standalone pages.
- **`projects/`**: Project notes detailing active/completed personal projects.
- **`docs/`**: Documentation notes, guides, and reference material.
- **`special/`**: Core site pages with fixed URLs (e.g., Homepage, 404, specific category listings).

### System & Workflow Folders (Agent-Authorized & Collaborative)
- **`_AI/`**: This directory! Contains AI configurations, specialized agent-only skills, and brainstorm drafts.
  - **`_AI/issues/`**: Active task and bug tracking system. If a feature or bug is identified, create a note here using the `0000-issue.md` template. Codebase developer agents can read and execute these issues independently.
- **`_Internet-Archive/`**: Storage for UAP documents (under `PURSUE_releases/`), Internet Archive (IA) item notes, logs, and upload scripts.
- **`_writers-room/`**: Collaborative writing room for you and the user to draft and co-author content. Your drafts are ignored by Git (via `.gitignore`), ensuring clean commits while keeping the directory structure tracked on GitHub.
- **`_private/`**: Collaboration files and shared records. These files are **not published** to the live website but are tracked in the Git repository to facilitate file sharing and co-working between collaborators.
- **`bases/`**: Obsidian `.base` reference files. These serve as a fancy central dashboard inside Obsidian to overview and manage all site content across `posts/`, `pages/`, `docs/`, `projects/`, etc.
- **`.obsidian/`**: The real Obsidian vault configuration, plugins, and settings.
  > [!NOTE]
  > Obsidian acts as a **headless CMS** for the Astro site. Therefore, configuration and plugin settings inside `.obsidian/` directly affect how Astro parses and renders pages on the live site (e.g., how wikilinks, callouts, and frontmatter are processed).
- **`_Clippings/`**: This is where the **Obsidian Web Clipper** saves web clippings and captured research notes. While specialized workflows (e.g., sorting or summarization) will be established later, agents can use this folder to inspect source clippings and referenced research.

---

## 🛠️ AI Toolbox & Skills Catalog

Agents have access to two types of skills to help automate workflows in this vault.

### Global Workspace Skills (Environment)
These skills reside in the workspace configuration (`.agents/skills/`) and assist with general system/tool integration:
- **`obsidian-cli`** (`.agents/skills/obsidian-cli/`): The interface to interact directly with the Obsidian vault. Use this to read/write notes, search properties, list tags, manage daily notes, etc.
- **`internet_archive (ia)`** (`.agents/skills/internet_archive/`): Interact programmatically with `archive.org` via the `ia` CLI tool to search, download, or manage historical collections.

### Vault-Specific Workflow Skills
These skills reside inside the vault itself (`_AI/skills/`) and are custom-tailored to Cybernati's data tasks:
- **`PURSUE`** (`_AI/skills/PURSUE/`): Process, sort, catalog, and initiate uploads for declassified UAP document releases from the Department of War / AARO under the PURSUE Act. Sets up the configuration notes required for the bulletproof upload scripts.
- **`process-clippings`** (`_AI/skills/process-clippings/`): Ingest, sort, and analyze web clippings captured via the Obsidian Web Clipper. Organizes clippings inside a collaborative `_writers-room/` workspace and generates a standardized `agent-report.md` for co-authoring.

---

## 📜 Agent Guidelines & Context

- **Vault-Scope Boundary**: Never perform any action or make edits to files outside the vault directory (`src/content/`) unless explicitly and directly requested by the user. This is critical to protect the Astro workspace code and prevent regression.
- **Obsidian Settings & Plugins Security**: Never modify files in `.obsidian/` (including plugins, themes, and configuration files). Astro's build parser relies on the specific Obsidian setup, and altering these files can break how pages are rendered or built on the live site.
- **Link Integrity**: Ensure all internal links in content use standard Markdown or Obsidian wikilinks (`[[Note Name]]`) correctly to maintain compatibility between the live Astro site and Obsidian.
- **Issue Tracking Workflow (Separation of Concerns)**: Keep site code development strictly separate from vault research and writing. If you identify a codebase feature request, styling issue, layout adjustment, or bug, **do NOT edit codebase files**. Instead, log a descriptive issue note inside the `_AI/issues/` directory using the `0000-issue.md` template. This allows designated developer agents to review, plan, and execute those codebase modifications safely.
- Always consult both the vault-level `AGENTS.md` and the root-level `AGENTS.md` for full context on boundaries, Tailwind variables, and Astro instructions.

