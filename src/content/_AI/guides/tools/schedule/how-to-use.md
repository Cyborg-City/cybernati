# Schedule Tool — How to Use (Pi Agent Only)

> **⚠️ This guide is for Pi coding agents only.** The schedule tool (`schedule()`, `schedules()`, `cancel_schedule()`) is exclusive to Pi. Other coding agents like Claude Code, Cursor, GitHub Copilot, or Windsurf do **not** have access to this tool. If you are not a Pi agent, ignore this file.

> **What it is**: A Pi-exclusive tool that lets you set timers while you're working. When a timer fires, it sends a message into the chat and pings the agent.

## Why It Exists

Agents don't need to busily-loop or block while waiting for something. Instead, set a timer, do other work, and the agent gets notified when it's time to check back.

---

## Syntax

### As an Agent (using tools)

Use the `schedule` tool directly:

```
schedule(duration: "30s", note: "check if download completed")
schedule(duration: "5m", note: "walk the dog")
schedule(duration: "1h", note: "check build status")
```

Absolute time (uses system timezone, detected automatically):

```
schedule(duration: "5:11pm", note: "walk the dog")
schedule(duration: "17:30", note: "standup")
schedule(duration: "3pm", note: "meeting")
```

Other tools:

```
schedules()              → List all active timers
cancel_schedule(id: ...) → Cancel a timer by its ID
```

### As a User (with a command)

In the chat:

```
/schedule 30s check the download
/schedule 5:11pm walk the dog
```

---

## Time Format Reference

| Format | Example | Description |
|--------|---------|-------------|
| `30s` | `30s` | 30 seconds |
| `5m` | `5m` | 5 minutes |
| `1h` | `1h` | 1 hour |
| `1.5h` | `1.5h` | 1 hour 30 minutes |
| `5:11pm` | `5:11pm` | 5:11 PM (your local time) |
| `17:30` | `17:30` | 5:30 PM (24h) |
| `3pm` | `3pm` | 3 PM |

---

## Strategies for Long-Running and Multi-Tasking Workflows

The schedule tool becomes much more powerful when combined with `bash`. Instead of blocking on a long command or busy-waiting in a loop, use these patterns to work asynchronously.

### Strategy 1: Fire and Check (Basic Loop)

The simplest pattern. Kick off a long command, set a timer, walk away.

```
# Agent turn 1
bash(ia upload bigfile.tar.gz)
schedule(duration: "30s", note: "check if ia upload finished")
# End turn → timer fires → agent comes back
```

**Best for:** Single long-running commands where you don't know exact runtime.

### Strategy 2: Staggered Timers (Parallel Work)

Fire multiple independent commands at once, each with its own timer. They come back as they finish, no need to batch.

```
# Agent turn 1 — fire all three, set staggered checks
bash(pnpm build:images)
schedule(duration: "30s", note: "check images build")

bash(ia upload release-01.zip)
schedule(duration: "2m", note: "check release-01 upload")

bash(pnpm run graph-data)
schedule(duration: "1m", note: "check graph-data generation")
# End turn — each timer independently fires the agent
```

**Best for:** Independent tasks with different expected runtimes. Avoids waiting for the slowest task just to check on a fast one.

### Strategy 3: Daisy Chain (Conditional Pipeline)

Chain commands conditionally — the result of one determines what runs next.

```
# Agent turn 1
bash(pnpm run validate-content)
schedule(duration: "15s", note: "check content validation")
# Timer fires — if validation passed, fire the build
# Agent turn 2
bash(pnpm build)
schedule(duration: "2m", note: "check build")
```

**Best for:** Pipelines where each step depends on the previous one succeeding.

### Strategy 4: Batched Checkpoint (One Timer, Many Commands)

Fire several commands, set one timer for the longest expected runtime, check everything at once.

```
# Agent turn 1 — fire all parallel tasks
bash(ia upload images.zip)
bash(ia upload documents.zip)
bash(ia upload videos.zip)
schedule(duration: "5m", note: "check all three uploads")
# End turn — single timer fires, check all three at once
```

**Best for:** Tasks with similar expected runtimes. Simpler to manage than staggered timers when timing is predictable.

### Strategy 5: Progressive Polling with Dignity

Instead of fixed 30s loops, scale the interval up. Start aggressive, back off as the task runs longer.

**The recommended ladder:** **30s × 3 → 1m × 3 → 2m × 3 → 5m**. Stay at 30s for at least 3 checks before incrementing. Never jump to a longer interval early — the task might finish right after you stop looking.

```
# Agent turn 1 — first of three 30s checks
bash(pnpm build)
schedule(duration: "30s", note: "check build (1/3 at 30s)")

# Timer fires — still running
# Agent turn 2 — second 30s check
schedule(duration: "30s", note: "check build (2/3 at 30s)")

# Timer fires — still running
# Agent turn 3 — third 30s check
schedule(duration: "30s", note: "check build (3/3 at 30s)")

# Timer fires — still running
# Agent turn 4 — now escalate to 1m
schedule(duration: "1m", note: "check build (1/3 at 1m)")
```

**Best for:** Commands with unpredictable runtimes. Reduces chatter while keeping you responsive.

**When to stop polling:** If the task is still running after reaching the 5m tier, it may be stuck. Run a status check (e.g., `ps`, `jobs`, check temp files) before scheduling another poll — don't blindly loop forever.

### Strategy 6: Error Pre-Flight

Run a quick validation first. Only fire the long command if the pre-flight passes. Saves time and timer slots.

```
# Agent turn 1 — validate first
bash(check-images)
schedule(duration: "10s", note: "check image validation")

# Timer fires — validation passed
# Agent turn 2 — now fire the expensive command
bash(pnpm build --production)
schedule(duration: "3m", note: "check production build")
```

**Best for:** Expensive commands that might fail due to upstream issues (missing files, invalid config, etc.).

### Choosing the Right Strategy

| You need... | Use this |
|-------------|----------|
| A single long task | Fire and Check |
| Several independent tasks | Staggered Timers or Batched Checkpoint |
| A pipeline with dependencies | Daisy Chain |
| Unknown runtime | Progressive Polling |
| Guard against wasted work | Error Pre-Flight |

---

## Behavioral Notes

### What Happens When a Timer Fires

1. The extension calculates remaining time every second (shown in the footer status bar).
2. When timer fires, it calls `pi.sendUserMessage()` with `deliverAs: "followUp"`.
3. If the agent is busy (mid-stream), the message queues automatically.
4. If queuing also fails, it retries with exponential backoff (500ms → 1s → 2s → 4s → max 5s, up to 10 retries).

### What Does NOT Work

- **"Tomorrow" times**: `5:11pm` only refers to today. If that time is already past, you get an error.
- **Timezones**: `5:11pm` uses your system's detected timezone. No manual override yet.

### Edge Cases

| Situation | Behavior |
|-----------|----------|
| Agent idle when timer fires | Message arrives immediately |
| Agent mid-stream | Message queues, arrives after stream ends |
| Multiple timers fire at once | All delivered sequentially |
| Invalid time format | Error with supported formats listed |
| Time already passed today | Error: "time already passed" (no auto-advance to tomorrow) |

---

## Related

- Extension source: `../.pi/extensions/schedule/index.ts`
- Extension settings: `../.pi/settings.json`
- Pi extension docs: `docs/extensions.md` in the pi package installation directory
