# Logging Standard

> **Mandatory rule**: Every tool or script that executes code MUST write a JSONL log file.

## Why

Logging gives us a trail of what ran, when, and whether it succeeded. Without it, agents have no memory of past runs, errors go unseen, and debugging is guesswork.

For a personal vault, logs are small (KB per tool per month). The cost is near zero. The value compounds.

---

## The Rule

1. **Log on every execution.** At minimum, log when the script starts or completes its action.
2. **Log errors.** If something fails, log it with `"level": "error"`.
3. **Log file location:** `<script-dir>/logs/<tool-name>.jsonl`
4. **No excuses.** Install logging first, logic second.

---

## Format: JSONL

JSONL (JSON Lines) means one JSON object per line. It's append-friendly, machine-parseable, and flexible for any script's needs.

### Required Fields

Every log entry MUST have these four fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `ts` | string | ISO 8601 timestamp (UTC) | `"2026-05-27T15:30:00.000Z"` |
| `level` | string | Log level: `info`, `warn`, `error`, `debug` | `"info"` |
| `tool` | string | Name of the script/tool/extension | `"schedule"` |
| `msg` | string | Human-readable summary | `"Timer set: 5m walk the dog"` |

### Optional Fields

Tools MAY add extra fields for context. Anything goes — IDs, durations, error details, etc.

### Example

```jsonl
{"ts":"2026-05-27T15:30:00.000Z","level":"info","tool":"schedule","msg":"Timer set: 5m walk the dog","duration":"5m","id":"sched_m1abc_9x2p"}
{"ts":"2026-05-27T15:35:00.000Z","level":"info","tool":"schedule","msg":"Timer fired: walk the dog","id":"sched_m1abc_9x2p"}
{"ts":"2026-05-27T15:35:00.050Z","level":"error","tool":"schedule","msg":"Send failed: agent busy","id":"sched_m1abc_9x2p","retry":2}
```

---

## Log File Location

**Per-script logs** go in a `logs/` subdirectory alongside the script:

```
<your-script-dir>/
  index.ts                ← The script
  logs/
    <tool-name>.jsonl     ← Append-only log file
```

Examples:

```
.pi/extensions/schedule/
  index.ts
  logs/schedule.jsonl

.agents/skills/internet_archive/
  scripts/upload.sh
  logs/ia-upload.jsonl

_AI/ai-dashboard/
  app.py
  logs/dashboard.jsonl
```

### Naming

| Rule | Example |
|------|---------|
| One log file per tool | `schedule.jsonl`, `ia-upload.jsonl`, `dashboard.jsonl` |
| Lowercase, kebab-case | ✅ `ia-upload.jsonl` ❌ `IA_Upload.jsonl` |
| Matches the tool name | If the tool is called `schedule`, the log is `schedule.jsonl` |

### Rotation

**No rotation needed** for personal use. One file per tool, append forever.

Expected size: ~100 bytes per entry. Even at 100 entries per tool per month, that's ~120 KB per year per tool. Negligible.

If you ever need to clean up, a one-liner:

```bash
# Archive logs older than 90 days
find logs/ -name "*.jsonl" -mtime +90 -exec gzip {} \;
```

---

## Implementation Pattern

### Node.js / TypeScript

```typescript
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

function log(level: string, msg: string, extra: Record<string, any> = {}): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    tool: "my-tool",
    msg,
    ...extra,
  }) + "\n";

  const logDir = join(__dirname, "logs");
  mkdirSync(logDir, { recursive: true });
  appendFileSync(join(logDir, "my-tool.jsonl"), entry);
}

// Usage:
log("info", "Script started");
log("error", "Upload failed", { url: "https://...", status: 500 });
```

### Python

```python
import json
import os
from datetime import datetime, timezone

def log(level: str, msg: str, **extra):
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "tool": "my-tool",
        "msg": msg,
        **extra,
    }
    log_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(log_dir, exist_ok=True)
    with open(os.path.join(log_dir, "my-tool.jsonl"), "a") as f:
        f.write(json.dumps(entry) + "\n")

# Usage:
log("info", "Script started")
log("error", "Upload failed", url="https://...", status=500)
```

### Shell (bash)

```bash
log() {
  local level="$1"
  local msg="$2"
  local entry=$(cat <<JSON
{"ts":"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)","level":"$level","tool":"my-tool","msg":"$msg"}
JSON
  )
  mkdir -p "$(dirname "$0")/logs"
  echo "$entry" >> "$(dirname "$0")/logs/my-tool.jsonl"
}

log "info" "Script started"
```

---

## Inspecting Logs

```bash
# Latest entries
tail -10 logs/schedule.jsonl

# Count by level
jq -r '.level' logs/schedule.jsonl | sort | uniq -c

# Filter errors
jq 'select(.level == "error")' logs/schedule.jsonl

# All entries for a specific timer
jq 'select(.id == "sched_m1abc_9x2p")' logs/schedule.jsonl

# Watch live
tail -f logs/schedule.jsonl
```

---

## Related

- Cardinal rule in [`../../AGENTS.md`](../../AGENTS.md)
- Schedule extension reference implementation: [`../../.pi/extensions/schedule/index.ts`](../../.pi/extensions/schedule/index.ts)
