# Schedule Extension — How to Use

> **What it is**: A Pi agent extension that lets you set timers while you're working. When a timer fires, it sends a message into the chat and pings the agent.

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
