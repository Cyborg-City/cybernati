# Guides

> [!NOTE]
> This directory is the **Cybernati Agent Runbook** — a collection of procedural guides for common tasks, tools, and workflows. Think of it as the operations manual for AI agents working in this vault.

## Structure

Guides are organized by category. Each category gets a subdirectory with one or more guide files.

```
guides/
  README.md                     ← This file
  guide-TOC.md                  ← Linked listing of every guide
  tools/                        ← Guides for specific tools/utilities
    schedule/                   ← Pi schedule extension
      how-to-use.md
  patterns/                     ← Reusable design patterns & mechanisms
    agent-message-injection.md  ← sendUserMessage & injection pattern
  rules/                        ← Mandatory development standards
    logging-standard.md         ← JSONL logging for every script
```

## Categories

| Directory | Purpose |
|-----------|---------|
| `tools/` | How to use specific tools, extensions, and utilities available to agents. Setup, syntax, common pitfalls, and example workflows. |
| `patterns/` | Reusable design patterns and mechanisms. The building blocks you use to build agent workflows. |
| `rules/` | Mandatory development standards. These are cardinal rules — follow them in every script. |

## How to Create a Guide

1. **Choose a category.** If your guide is about a specific tool or extension, it goes in `tools/`. If it describes a reusable mechanism or design pattern, use `patterns/`. If neither fits, create a new category folder.

2. **Create the guide file.** Use a descriptive name:
   - `tools/schedule/how-to-use.md` — one tool, one guide
   - `patterns/agent-message-injection.md` — one pattern, one file

3. **Write the guide.** Cover what it is, why it exists, syntax/usage, behavioral notes, edge cases, and related links. Keep it skimmable with tables and code blocks.

4. **Add it to the catalog.** Update this README's structure diagram and category table to include the new guide.

5. **Add it to the table of contents.** Append a row in [guide-TOC.md](guide-TOC.md) so everything is findable from one place.

6. **Update the AI Portal.** If it's a major addition, add a link in `_AI/ai-portal.md` under the `_AI/guides/` entry.

## Guide Table of Contents

See [guide-TOC.md](guide-TOC.md) for a complete, linked listing of every guide in this directory.

## Why This Exists

The AI Portal (`_AI/ai-portal.md`) tells you *what* exists. The Guides tell you *how to use it*. Separating them keeps the portal lean and the guides detailed.

If you discover a non-obvious workflow, a painful gotcha, or a clever technique — **add it here** so future agents don't have to rediscover it.
