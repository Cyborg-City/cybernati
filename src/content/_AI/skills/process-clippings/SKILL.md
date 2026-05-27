---
name: process-clippings
description: >
  Process, ingest, and catalog web clippings captured by the Obsidian Web Clipper.
  Automatically organizes clippings into a collaborative writers-room workspace,
  performs interactive source-by-source extraction of summaries and entities,
  uses the Obsidian CLI where appropriate for reading and searching, and compiles/appends
  to the standardized agent-report.md note for collaborative co-authoring.
triggers:
  - "process clippings"
  - "ingest clippings"
  - "new clippings"
  - "process clipping"
allowed-tools: Bash, Read, Write, Edit
---

# Process Clippings Skill (Interactive, One-by-One Workflow)

## Overview
This skill handles the ingestion, directory organization, per-source analysis, and reporting phases for web clippings in `_Clippings/`. 

To ensure the user stays fully in the loop, **clippings are processed one at a time**. The agent analyzes each clipping individually, writes/appends its data to the standardized `agent-report.md` inside the collaborative workspace, and halts to discuss the findings with the user before starting the next clipping.

---

## Rigid Step-by-Step Instructions

The processing agent MUST execute these steps in strict sequential order:

### Step 1: Input Validation & File Gathering
1. Look at the arguments passed to the skill.
2. If the user **did not** specify a clipping file to process:
   - Stop and ask the user directly in the chat to specify the path of the single clipping file they want to process next.
3. If a clipping file **is** specified:
   - Verify that the target clipping file exists inside `_Clippings/` or `_Clippings/shared/` by using the Obsidian CLI:
     ```bash
     obsidian search query="file: {clipping-filename}"
     ```
     *(If the CLI is not running or search fails, fallback to standard filesystem check).*
   - If the file does not exist, stop and report the error.

### Step 2: Full Source Ingestion
1. Read the **entire content** of the target clipping file.
2. Where appropriate, utilize the Obsidian CLI to read the file:
   ```bash
   obsidian read path="_Clippings/{clipping-filename}.md"
   ```
   *(If the clipping is complex or the CLI is unavailable, fallback to direct file-reading tools).*

### Step 3: Determine target Writers-Room Folder
1. **Case A: First Clipping in a New Session**
   - The agent reads the title of the clipping.
   - Instantly formulate a clean, lowercase, hyphenated directory name based on that title (e.g. `uap-origins-1940s`).
   - Create the directory at `src/content/_writers-room/{derived-title}/`.
2. **Case B: Subsequent Clipping (Adding to an Existing Room)**
   - Check the user's prompt or context to identify which existing `_writers-room/` directory this clipping belongs in. 
   - If unclear, ask the user in the chat before moving files.

3. **Move File**: Move the target clipping file *into* `src/content/_writers-room/{target-title}/`.

### Step 4: Write or Append to Ingestion Report (`agent-report.md`)
1. Check if `src/content/_writers-room/{target-title}/agent-report.md` already exists.
2. **If creating a NEW report (First Clipping)**:
   - Read the standardized template at `src/content/_AI/skills/process-clippings/resources/agent-report-template.md`.
   - Create `agent-report.md` inside `src/content/_writers-room/{target-title}/`.
   - Populate the `📋 Ingested Sources Overview` table with this first source.
   - Write the `## 🔍 Source-by-Source Analysis` block for this source.
   - Leave `Cross-Source Entity Map` blank or seeded.
3. **If APPENDING to an existing report (Subsequent Clippings)**:
   - Read the existing `agent-report.md` using file viewing tools.
   - **Update Sources Table**: Append a new row for the new clipping in the `📋 Ingested Sources Overview` markdown table.
   - **Append Analysis**: Append a new `### 📄 Source {N}: {Title}` analysis block inside the `## 🔍 Source-by-Source Analysis` section.
   - **Update Cross-Source Map**: Analyze how entities inside this new clipping overlap with the previously processed clippings. Update the `## 🗺️ Cross-Source Entity Map & Connections` section with any shared entities or connecting mechanisms.

4. **Extract & Populate Report Content**:
   - Write a dense 1-2 paragraph **Source Summary**.
   - Compile bulleted lists of **Key Concepts & Core Ideas**.
   - Extract **People**, **Places**, and **Events** (with roles, descriptions, and exact dates).
   - **Strict Formatting Rule**: **No YAML Frontmatter** in `agent-report.md`. Start directly with Markdown headers.

### Step 5: Vault Cross-Linking (via Obsidian CLI)
1. For key extracted entities (e.g., specific people, projects, facilities), run an Obsidian search to check if they already exist in other vault notes:
   ```bash
   obsidian search query="{entity-name}"
   ```
2. If the search returns existing vault notes (e.g., UAP index pages, past project notes), list them under the `## 🔗 Related Vault Connections` section inside `agent-report.md` using standard wikilinks (e.g., `[[Note Name]]`).

### Step 6: Report to User
1. Respond to the user in chat.
2. Provide the clear, copy-pasteable relative paths for the collaborative workspace:
   - **Collaborative Workspace**: `_writers-room/{target-title}/`
   - **Agent Report Note**: `_writers-room/{target-title}/agent-report.md`
3. Invite the user to read the per-source summaries, ask questions, and begin co-authoring the synthesized content.

---

## File and Folder Structure Reference

```
src/content/
├── _Clippings/
│   ├── shared/                # Tracked in Git, files committed
│   └── archived/              # Tracked in Git, files ignored (.gitignore)
├── _writers-room/
│   └── {derived-title}/       # Ignored by Git (contents), tracked folder
│       ├── file-1.md          # Moved source clippings (processed)
│       └── agent-report.md    # Compiled and updated per-source report
└── _AI/
    └── skills/
        └── process-clippings/
            ├── SKILL.md       # This rigid instruction file
            └── resources/
                └── agent-report-template.md  # Standardized template
```
