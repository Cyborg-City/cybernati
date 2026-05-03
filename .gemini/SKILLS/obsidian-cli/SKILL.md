---
name: obsidian-cli
description: >
  Complete reference for the Obsidian CLI — the command-line interface for Obsidian vaults.
  Use this skill whenever the user asks about any `obsidian` command, flags, or workflows:
  reading/writing notes, appending to daily notes, searching the vault, managing properties,
  tasks, plugins, themes, sync, publish, file operations, or any other Obsidian CLI operation.
  Trigger on mentions of: obsidian read, obsidian create, obsidian append, obsidian search,
  obsidian daily, obsidian tasks, obsidian tags, obsidian properties, obsidian eval,
  or any question about Obsidian CLI flags, vault targeting, or automation workflows.
---

# Obsidian CLI

## Workflow

**Use the obsidian CLI for:**
- Reading notes (`obsidian read`, `obsidian daily:read`)
- Searching the vault (`obsidian search`, `obsidian search:context`)
- Navigating structure (`obsidian files`, `obsidian folders`, `obsidian outline`)
- Querying metadata (`obsidian tags`, `obsidian properties`, `obsidian tasks`)
- Appending/prepending content to notes
- Running plugin APIs via `obsidian eval`

**Use Edit/Write tools directly for:**
- Surgical edits to specific lines — the CLI's `create --overwrite` rewrites the entire file, not a diff
- Any content containing backticks (see Known Gotchas)

## Known Gotchas

- **`daily:append content=` returns exit 127** when any `content=` parameter is passed. Workaround: use `obsidian append path=<vault-relative-path> content=<text>` with the explicit file path instead.
- **Backticks in `content=` get shell-interpolated** — any inline code in content will be corrupted. Workaround: use the Write tool directly to bypass the CLI entirely.
- **Obsidian must be running** — if it's not open, run `obsidian open` to launch the desktop app. All CLI commands require Obsidian to be running.

## Looking Up Syntax

Don't rely on memorized docs. Run `obsidian help` for the full command list, or `obsidian help [command]` for specific syntax:

```bash
obsidian help
obsidian help search
obsidian help append
```

## Plugins

Custom workflows for specific Obsidian plugins. Each plugin folder contains a README with usage patterns and a `scripts/` directory with reusable JS snippets.

| Plugin | Path | Description |
|--------|------|-------------|
| smart-connections | `plugins/smart-connections/README.md` | Semantic vector search via Smart Connections v4 API |

### Managing plugins

**Adding a plugin:**
1. Create `plugins/<plugin-name>/README.md` with usage patterns, examples, and gotchas
2. Create `plugins/<plugin-name>/scripts/` for any reusable JS snippets (used with `obsidian eval`)
3. Add a row to the plugin table above

**Removing a plugin:**
1. Delete the `plugins/<plugin-name>/` directory
2. Remove its row from the plugin table above

Each plugin is fully self-contained in its directory — no shared scripts, no cross-references. Deleting a plugin folder cleanly removes everything related to it.
