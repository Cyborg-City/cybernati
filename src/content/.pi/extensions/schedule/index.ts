/**
 * Schedule Extension
 *
 * Provides timer/reminder functionality that pings the agent when timers fire.
 * Supports both duration ("30s", "5m") and absolute time ("5:11pm", "17:30").
 * Detects system timezone automatically. Shows detected zone so you can verify.
 *
 * Why this exists:
 * - Agents need a way to "sleep" without blocking or eating tokens
 * - Background tasks need completion notification
 * - Users want reminders at specific times without leaving their workflow
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

// ── State ──

// Active timers: scheduleId -> NodeJS.Timeout handle
const activeTimers = new Map<string, NodeJS.Timeout>();

// Timer metadata: scheduleId -> { message, firesAt }
const scheduleMeta = new Map<string, { message: string; firesAt: number }>();

// Background interval that updates the footer countdown every second
let countdownInterval: NodeJS.Timeout | null = null;

// Detected system timezone (shown to user for verification)
let detectedTimezone: string | null = null;

export default function scheduleExtension(pi: ExtensionAPI) {

  // ── Detect Timezone ──
  // Use Intl API to get the OS timezone. This works in Node.js and browsers.
  // We store it so we can show it to the user and use it for absolute time parsing.
  try {
    detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    detectedTimezone = null;
  }

  // ── Session Start Hook ──
  pi.on("session_start", (_event, ctx) => {
    ctx.ui.notify("⏰ Schedule extension ready", "info");

    // Show detected timezone so user knows what we're using
    if (detectedTimezone) {
      ctx.ui.notify("Detected timezone: " + detectedTimezone, "info");
    }

    const schedTools = pi.getAllTools()
      .map(t => t.name)
      .filter(n => n.includes("sched"));

    if (schedTools.length > 0) {
      ctx.ui.notify("Schedule tools: " + schedTools.join(", "), "info");
    }
  });

  // ── Tool: schedule ──
  pi.registerTool({
    name: "schedule",
    label: "Schedule",
    description:
      "CALL THIS FROM YOUR TOOLS LIST (not bash, not /schedule). " +
      "Same pattern as read/write: schedule({duration, note}). " +
      "Duration: 30s, 5m, 1h. Absolute: 5:11pm, 17:30. " +
      "Timezone: " + (detectedTimezone || "unknown") + ".",
    promptSnippet: "CALL schedule({duration, note}) FROM YOUR TOOLS LIST — same as read/write. NOT bash, NOT /schedule. Example: schedule({duration:\"5m\", note:\"check build\"}).",
    promptGuidelines: [
      "Call schedule({duration, note}) from your tools list, just like read/write/edit.",
      "NEVER call schedule from bash or as a shell command — that fails.",
      "NEVER use /schedule — that's the user command, not for agents.",
      "Supports durations (30s, 5m, 1h) and absolute times (5:11pm, 17:30).",
      "Use instead of busy-waiting or sleep loops.",
    ],
    parameters: Type.Object({
      duration: Type.String({
        description:
          "When the timer should fire. " +
          "Duration: '30s', '5m', '1h', '1.5h'. " +
          "Absolute time: '5:11pm', '17:30', '3pm'. " +
          "Uses system timezone: " + (detectedTimezone || "unknown") + ".",
      }),
      note: Type.String({
        description:
          "What to display when timer fires. " +
          "Examples: 'check if download completed', 'walk the dog'",
      }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx: ExtensionContext) {
      // Try to parse as absolute time first, then fallback to duration
      let ms: number | null = parseAbsoluteTime(params.duration);
      let isAbsolute = true;

      if (!ms) {
        ms = parseDuration(params.duration);
        isAbsolute = false;
      }

      if (!ms) {
        log("error", "Invalid time input", { input: params.duration });
        return {
          content: [
            {
              type: "text",
              text:
                "❌ Could not parse: '" +
                params.duration +
                "'. Use formats like:\n" +
                "  Duration: 30s, 5m, 1h, 1.5h\n" +
                "  Absolute: 5:11pm, 17:30, 3pm\n" +
                "  Timezone: " + (detectedTimezone || "unknown"),
            },
          ],
          details: { error: "invalid_time", input: params.duration },
        };
      }

      // Check if absolute time is in the past
      if (isAbsolute && ms < 0) {
        log("warn", "Time already passed today", { input: params.duration, timezone: detectedTimezone });
        return {
          content: [
            {
              type: "text",
              text:
                "❌ That time has already passed today: " +
                params.duration +
                " (timezone: " + (detectedTimezone || "unknown") + ")",
            },
          ],
          details: { error: "time_in_past", input: params.duration },
        };
      }

      const id = generateId();
      const firesAt = Date.now() + ms;

      const timer = setTimeout(() => {
        ctx.ui.setStatus("schedule", undefined);
        log("info", "Timer fired", { id, note: params.note });
        sendTimerNotification(pi, "⏰ Timer: " + params.note);
        activeTimers.delete(id);
        scheduleMeta.delete(id);

        if (activeTimers.size === 0 && countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }, ms);

      activeTimers.set(id, timer);
      scheduleMeta.set(id, { message: params.note, firesAt });

      ensureCountdownInterval(ctx);

      log("info", "Timer set", { id, note: params.note, duration: params.duration, firesAt });

      return {
        content: [
          {
            type: "text",
            text:
              "✅ Scheduled: " + params.note +
              (isAbsolute
                ? " (fires at " + params.duration + " " + (detectedTimezone || "local") + ")"
                : " (fires in " + formatDuration(ms) + ")"),
          },
        ],
        details: {
          id,
          duration: params.duration,
          durationMs: ms,
          note: params.note,
          firesAt,
          timezone: detectedTimezone,
        },
      };
    },
  });

  // ── Tool: schedules ──
  pi.registerTool({
    name: "schedules",
    label: "Schedules",
    description: "List all active scheduled timers with remaining time",
    promptSnippet: "List active scheduled timers",
    parameters: Type.Object({}),

    async execute(_toolCallId, _params, _signal, _onUpdate, ctx: ExtensionContext) {
      const now = Date.now();
      const active: string[] = [];

      for (const [id, meta] of scheduleMeta) {
        const remaining = meta.firesAt - now;
        if (remaining > 0) {
          active.push(
            "• " + id + ": " + meta.message + " (⏳ " + formatDuration(remaining) + ")"
          );
        }
      }

      updateStatus(ctx);

      if (active.length === 0) {
        return {
          content: [{ type: "text", text: "📭 No active schedules." }],
          details: { schedules: [], count: 0 },
        };
      }

      return {
        content: [
          {
            type: "text",
            text: "⏰ Active schedules:\n" + active.join("\n"),
          },
        ],
        details: { schedules: active, count: active.length },
      };
    },
  });

  // ── Tool: cancel_schedule ──
  pi.registerTool({
    name: "cancel_schedule",
    label: "Cancel Schedule",
    description: "Cancel an active scheduled timer before it fires",
    promptSnippet: "Cancel a scheduled timer by ID",
    parameters: Type.Object({
      id: Type.String({
        description: "The schedule ID to cancel (e.g., 'sched_m1abc_9x2p')",
      }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx: ExtensionContext) {
      const timer = activeTimers.get(params.id);

      if (!timer) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Schedule '" + params.id + "' not found (already fired or wrong ID).",
            },
          ],
          details: { id: params.id, cancelled: false, error: "not_found" },
        };
      }

      clearTimeout(timer);
      activeTimers.delete(params.id);
      scheduleMeta.delete(params.id);
      updateStatus(ctx);

      if (activeTimers.size === 0 && countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      log("info", "Timer cancelled", { id: params.id });

      return {
        content: [{ type: "text", text: "✅ Cancelled: " + params.id }],
        details: { id: params.id, cancelled: true },
      };
    },
  });

  // ── Command: /schedule ──
  pi.registerCommand("schedule", {
    description: "Schedule a timer/reminder",
    handler: async (args: string, ctx: ExtensionContext) => {
      const parts = args.trim().split(/\s+/);
      if (parts.length < 2) {
        ctx.ui.notify("Usage: /schedule <duration|time> <note>", "warning");
        return;
      }

      const timeInput = parts[0];
      const note = parts.slice(1).join(" ");

      // Try absolute time first, then duration
      let ms: number | null = parseAbsoluteTime(timeInput);
      let isAbsolute = true;

      if (!ms) {
        ms = parseDuration(timeInput);
        isAbsolute = false;
      }

      if (!ms) {
        log("error", "Invalid time input (command)", { input: timeInput });
        ctx.ui.notify("❌ Invalid time/duration: " + timeInput, "error");
        return;
      }

      // Check if absolute time is in the past
      if (isAbsolute && ms < 0) {
        log("warn", "Time already passed today (command)", { input: timeInput, timezone: detectedTimezone });
        ctx.ui.notify(
          "❌ That time has already passed today: " + timeInput +
          " (timezone: " + (detectedTimezone || "unknown") + ")",
          "error"
        );
        return;
      }

      const id = generateId();
      const firesAt = Date.now() + ms;

      const timer = setTimeout(() => {
        ctx.ui.setStatus("schedule", undefined);
        log("info", "Timer fired (command)", { id, note });
        sendTimerNotification(pi, "⏰ Timer: " + note);
        activeTimers.delete(id);
        scheduleMeta.delete(id);

        if (activeTimers.size === 0 && countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }, ms);

      activeTimers.set(id, timer);
      scheduleMeta.set(id, { message: note, firesAt });

      ensureCountdownInterval(ctx);

      log("info", "Timer set (command)", { id, note, duration: timeInput, firesAt });

      ctx.ui.notify(
        "✅ Scheduled: " + note +
        (isAbsolute
          ? " (fires at " + timeInput + " " + (detectedTimezone || "local") + ")"
          : " (⏳ " + formatDuration(ms) + ")"),
        "info"
      );
    },
  });
}

// ── Countdown Logic ──

function ensureCountdownInterval(ctx: ExtensionContext) {
  if (countdownInterval) return;
  countdownInterval = setInterval(() => {
    updateStatus(ctx);
  }, 1000);
}

function updateStatus(ctx: ExtensionContext) {
  const now = Date.now();
  const active: string[] = [];

  for (const [, meta] of scheduleMeta) {
    const remaining = meta.firesAt - now;
    if (remaining > 0) {
      active.push(meta.message + ": " + formatDuration(remaining));
    }
  }

  if (active.length > 0) {
    ctx.ui.setStatus("schedule", "⏰ " + active.join(" | "));
  } else {
    ctx.ui.setStatus("schedule", undefined);
  }
}

// ── Time Parsers ──

/**
 * Parses absolute time like "5:11pm", "17:30", "3pm" into milliseconds until that time.
 * Uses system local time (not UTC). Returns null if parsing fails.
 * Returns negative if time is already past today (caller should handle).
 * Why: Users think in clock time, not "seconds from now".
 */
function parseAbsoluteTime(input: string): number | null {
  const s = input.trim().toLowerCase();

  // Match patterns:
  //   5:11pm, 5:11 pm, 5:11p, 5:11
  //   17:30, 17.30
  //   3pm, 3p
  const patterns = [
    // 5:11pm, 5:11 pm, 5:11p
    /^(\d{1,2}):(\d{2})\s*(am|pm|a|p)?$/,
    // 5.11pm (dot separator)
    /^(\d{1,2})\.(\d{2})\s*(am|pm|a|p)?$/,
    // 3pm, 3p, 3 am, 3 pm (no minutes)
    /^(\d{1,2})\s*(am|pm|a|p)?$/,
  ];

  let hours: number | null = null;
  let minutes: number | null = null;
  let ampm: string | null = null;

  for (const pattern of patterns) {
    const match = s.match(pattern);
    if (!match) continue;

    hours = parseInt(match[1], 10);
    minutes = match[2] ? parseInt(match[2], 10) : 0;
    ampm = match[3] || null;

    // Validate hours/minutes
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    break;
  }

  if (hours === null || minutes === null) {
    return null;
  }

  // Apply AM/PM conversion
  if (ampm) {
    const isPm = ampm.startsWith("p");
    const isAm = ampm.startsWith("a");

    if (isPm && hours !== 12) {
      hours += 12;
    }
    if (isAm && hours === 12) {
      hours = 0;
    }
  }

  // Build target time in local timezone
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  // Calculate milliseconds until target
  const ms = target.getTime() - now.getTime();

  return ms;
}

/**
 * Parses duration like "30s", "5m", "1h" into milliseconds.
 */
function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase();

  const match = s.match(/^(\d+(?:\.\d+)?)\s*([shm]|sec|min|hour)s?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s": case "sec": return Math.round(num * 1000);
    case "m": case "min": return Math.round(num * 60 * 1000);
    case "h": case "hour": return Math.round(num * 60 * 60 * 1000);
    default: return null;
  }
}

// ── Logging ──
// Every tool/script MUST log. See _AI/guides/rules/logging-standard.md
// We append to logs/schedule.jsonl alongside this file.

function log(level: string, msg: string, extra: Record<string, any> = {}): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    tool: "schedule",
    msg,
    ...extra,
  }) + "\n";

  try {
    // Use vault-relative path so logs survive across environments
    // __dirname may not resolve correctly in Pi's extension runtime,
    // so we try multiple locations and use the first one that works.
    const candidates = [
      join(__dirname, "logs"),
      join(process.cwd(), ".pi", "extensions", "schedule", "logs"),
    ];

    let logDir: string | null = null;
    for (const dir of candidates) {
      try {
        mkdirSync(dir, { recursive: true });
        logDir = dir;
        break;
      } catch {
        continue;
      }
    }

    if (logDir) {
      appendFileSync(join(logDir, "schedule.jsonl"), entry);
    }
  } catch {
    // Logging must never crash the extension.
    // If we're here, nothing worked — silently skip.
  }
}

// ── Helpers ──

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const m = minutes % 60;
    return hours + "h" + (m > 0 ? " " + m + "m" : "");
  }
  if (minutes > 0) {
    const s = totalSeconds % 60;
    return minutes + "m" + (s > 0 ? " " + s + "s" : "");
  }
  return totalSeconds + "s";
}

function generateId(): string {
  return (
    "sched_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 7)
  );
}

/**
 * Sends a timer notification with retry logic.
 * Uses deliverAs: "followUp" which waits for agent to be completely idle.
 * Retries with exponential backoff if agent is busy.
 */
function sendTimerNotification(pi: ExtensionAPI, message: string, attempt: number = 0): void {
  const maxRetries = 10;
  const baseDelay = 500;

  try {
    pi.sendUserMessage(message, { deliverAs: "followUp" });
  } catch (err: any) {
    if (attempt < maxRetries) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 5000);
      setTimeout(() => {
        sendTimerNotification(pi, message, attempt + 1);
      }, delay);
    } else {
      log("error", "Failed to send timer notification after retries", { message, retries: maxRetries });
    }
  }
}
