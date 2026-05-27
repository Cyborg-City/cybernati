---
title: AI Dashboard Brainstorm
tags:
  - project
  - dashboard
  - brainstorm
  - planning
---

# AI Dashboard Brainstorm

## Vision

Enhance agent skills by creating a **visual control panel/dashboard** that agents can use to display interactive UI elements when running scripts. The dashboard wraps skills to give them:

- Drag & drop uploaders
- Live logs
- Progress bars
- Search result cards
- Live previews (HTML, cards, designs)
- Interactive controls (color pickers, forms, etc.)

**Core Philosophy**: Keep it dead simple. Agents write scripts, scripts control the UI.

---

## What We've Built So Far

### ✅ Schedule Extension (Pi Extension)

**Location**: `src/content/.pi/extensions/schedule/`

A working timer/reminder system that both **users** and **agents** can invoke.

| Feature | Status |
|---------|--------|
| Extension loads at startup | ✅ |
| User `/schedule` command | ✅ |
| Agent `schedule()` tool | ✅ |
| Agent `schedules()` tool | ✅ |
| Agent `cancel_schedule()` tool | ✅ |
| Timer fires + pings agent via `sendUserMessage()` | ✅ |
| Footer status display | ✅ |
| `promptSnippet` for LLM discovery | ✅ |

**Usage:**
```bash
# User direct command
/schedule 30s walk the dog

# Agent tool invocation
schedule(duration="30s", note="check download status")
schedules()  # list active
cancel_schedule(id="sched_xxx")
```

**Key Insight**: The extension registers tools with `promptSnippet` so the LLM knows they exist and when to use them.

---

## Key Clarifications

### Skills & Scripts Are NOT in the Dashboard Directory

| Location | What |
|----------|------|
| `.agents/skills/` | Agent skills (many exist here) |
| Skills may have scripts | Lives inside skill directories or wherever makes sense |
| `ai-dashboard/` | Where the dashboard app lives ONLY |

**Scripts are wherever they naturally belong** — not forced into a specific structure. They could be:
- `.agents/skills/obsidian-cli/some-script.py`
- `.agents/skills/internet_archive/tools.py`
- Any other arbitrary location

### Communication Pattern (Proven)

**Pi Extension + `sendUserMessage()`**:
```
Agent calls schedule() tool
    ↓
Extension sets timer in background
    ↓
Timer fires → extension calls pi.sendUserMessage()
    ↓
Agent receives message, continues work
```

This pattern will work for dashboard notifications too:
```
Dashboard detects user action
    ↓
Dashboard HTTP endpoint or file watcher
    ↓
Pi extension detects change → sendUserMessage()
    ↓
Agent receives message with results
```

---

## Still To Polish (Schedule Extension)

- [ ] **Live countdown** — Status bar shows static time, doesn't tick down every second
- [ ] **Color themes** — Timer messages could use warning/accent colors more distinctly
- [ ] **Multiple timer display** — When many timers active, status bar could be clearer
- [ ] **Auto-cleanup edge cases** — If pi restarts, orphaned timer metadata may persist briefly

---

## Dashboard Architecture (Next)

### Dashboard lives in
`E:\cyborg-city\cybernati\src\content\_AI\ai-dashboard`

### Communication from Agent → Dashboard
**Option A (Python API)**:
- Agent script imports a small Python client
- Client writes to shared state (file or in-memory)
- Dashboard (Streamlit) reads and displays

**Option B (HTTP/REST)**:
- Dashboard runs a small HTTP server
- Agent scripts POST UI updates
- Dashboard displays immediately

### Communication from Dashboard → Agent
**Pattern: Extension Bridge**:
```
Dashboard (Streamlit) writes result to file
    ↓
Pi extension watches file or receives HTTP
    ↓
extension calls pi.sendUserMessage()
    ↓
Agent receives: "User picked color #ff0000"
```

### MVP Scope

**Focus**: New skills with UI scripts only

**Example targets**:
1. **IA Search Results** — Cards with selectable sources
2. **HTML Preview** — Live card design preview
3. **Color Picker** — Interactive color selection
4. **Generative UI** — Mockups before implementation

---

## Questions Still Open

- [ ] How does the Python API for pushing to dashboard work?
- [ ] Should dashboard always run, or start on-demand?
- [ ] How do scripts "register" intent (page vs widget)?
- [ ] Dashboard → Agent bridge: HTTP server or file watcher?
- [ ] How to keep dashboard and agent state in sync?

---

## Next Steps

1. ✅ ~~Build schedule extension (ping mechanism proven)~~
2. **Polish schedule extension** (live countdown, colors)
3. **Build dashboard foundation** — Streamlit app skeleton
4. **Build bridge** — Dashboard → Agent notification via extension
5. **First example skill** — Color picker or search results
6. **Iterate**

---

## Notes

- **Never use absolute paths** in code or config — keep it portable
- **`.pi/settings.json`** handles extension + skill discovery relative to `.pi/`
- **Extension errors** don't crash pi, they just log and skip
- **`promptSnippet`** is required for LLM to discover custom tools
