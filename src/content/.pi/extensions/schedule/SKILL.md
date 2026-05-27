# Schedule Extension

Schedule timers and reminders that ping the agent when they fire.

## Tools

### `schedule` — Schedule a Timer

Schedule a background timer. When it fires, a message is injected into the chat and the agent resumes processing.

**Parameters:**
- `duration` — Time until reminder fires (e.g., "30s", "5m", "1h", "1.5h", "1h30m")
- `note` — What to display when the timer fires

**Returns:** Schedule ID (for potential cancellation)

**Example:**
```
Use schedule(duration="30s", note="check if download completed")
```

**Use when:**
- Waiting for background processes (downloads, uploads, builds)
- Scheduling reminders during long tasks
- Polling for file changes or external events
- Deferring work for a specific interval

---

### `schedules` — List Active Timers

Shows all currently active scheduled timers.

**Example:**
```
Use schedules()
```

---

### `cancel_schedule` — Cancel a Timer

Cancel an active schedule before it fires.

**Parameters:**
- `id` — The schedule ID to cancel

**Example:**
```
Use cancel_schedule(id="sched_m1abc_9x2p")
```

---

## Workflow Patterns

### Pattern 1: Background Task with Check

```python
# Start a long-running task
schedule(duration="30s", note="check if IA upload finished")

# Agent continues with other work
# When timer fires, agent receives ping and checks state
```

### Pattern 2: Reminder

```python
schedule(duration="1h", note="walk the dog")
# Agent continues working
# User gets pinged in 1 hour
```

### Pattern 3: Polling Interval

```python
schedule(duration="10s", note="check upload progress")
# Agent checks state, reschedules if needed
```

### Pattern 4: Async Notification to Dashboard

```
schedule(duration="5s", note="Check dashboard for color_picker results")
# Dashboard should have written result by now
# Agent reads dashboard state and continues
```

---

## Duration Formats

| Format | Example |
|--------|---------|
| Seconds | `30s`, `30sec`, `45seconds` |
| Minutes | `5m`, `5min`, `10minutes` |
| Hours | `1h`, `1hour`, `2hours` |
| Decimal | `1.5h` (1.5 hours), `0.5m` (30 seconds) |
| Combined | `1h30m`, `30m15s`, `2h15m30s` |

---

## Tips

- **Don't wait in a loop** — Use `schedule` to set timers, do other work, and the agent will be notified when the timer fires
- **Check state on fire** — When a timer fires, the agent should check the relevant state file or dashboard
- **Multiple timers** — Multiple timers can be active simultaneously; each gets a unique ID
- **Cancellation** — Keep the schedule ID if you might need to cancel

---

## Integration with Dashboard

The `schedule` tool works alongside the AI Dashboard. When a timer fires:

1. Agent receives `⏰ Timer fired: <note>` message
2. Agent checks dashboard state (via file or API)
3. Agent continues with the result

This creates a clean async workflow where the dashboard runs independently and the agent checks back when signaled.
