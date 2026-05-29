# Issue: Async Command Runner — Wrapper Script with Message Injection

**Date Created**: 2026-05-27  
**Time Created**: 10:45 PM  
**Status**: Open  
**Severity**: Medium  

---

## 📝 Description

Build a Pi extension that acts as an **async wrapper for any CLI command**. Modeled after the schedule extension's message-injection pattern — agent fires off a command, ends its turn, and gets pinged when the command completes.

## 🎯 Goals & Requirements

### 🔴 Relision: Non-Negotiable Development Principles

These come first, before everything. No exceptions.

- **[TDD]** Always use Test-Driven Development. Write **red** (failing test), **green** (make it pass), **refactor** (clean it up). Always write the failing test first.
- **[DRY]** Don't repeat yourself. Every piece of knowledge has one authoritative representation.
- **[SOLID]** Single responsibility, open-closed, Liskov substitution, interface segregation, dependency inversion.
- **[DAMP Tests]** Descriptive And Meaningful Phrases — tests should read like a specification, not implementation.
- **[Beyoncé Rule]** If you like it, then you better put a test on it. Everything gets tested.
- **[TSdoc Comments]** Every function, class, and complex block gets a TSdoc comment explaining the *why* — not just the *what*. Document intent, edge cases, and assumptions.

> **⚠️ Critical:** This is a **Pi extension**, written in **TypeScript (`.ts`)**. It lives at `.pi/extensions/run-async/index.ts`. NOT a standalone script, NOT Python, NOT bash.

- [ ] **Async execution**: Agent calls `run_async({command, returnMode})`, gets back an ID, process runs in background
- [ ] **Completion notification**: When process exits, extension injects a message via `sendUserMessage(followUp)` to wake the agent
- [ ] **Return modes**: `summary` (exit code + last few lines), `passfail` (just pass/fail), `full` (all output)
- [ ] **Output buffering**: Cap at ~10KB in memory; overflow stored to temp file agent can read
- [ ] **Process survivability**: Use `detached: true` so processes survive Pi restart; PID file for reattachment
- [ ] **Interactive prompt detection**: Heuristic — if process outputs without exiting within 2s, flag as "awaiting input"
- [ ] **Timeout support**: Optional timeout kills the child process
- [ ] **Concurrent commands**: Multiple processes tracked by ID (same pattern as activeTimers in schedule extension)
- [ ] **Logging**: Follow the logging standard — JSONL to `logs/run-async.jsonl`
- [ ] **Cross-platform**: Works on Windows (the user's OS) and Unix

## 🛠️ Proposed Solution / Implementation Details

### Extension at `.pi/extensions/run-async/index.ts`

```typescript
pi.registerTool({
  name: "run_async",
  parameters: {
    command: string,          // e.g. "ia upload bigfile.tar.gz"
    returnMode: "summary" | "full" | "passfail",
    timeout?: number,         // optional timeout in seconds
  }
})
```

### Core mechanism

1. `child_process.spawn(command, { shell: true, detached: true })`
2. Collect stdout/stderr in buffers (capped)
3. On `exit` event: call `sendTimerNotification`-style retry helper
4. Completion message includes: exit code, PID, returnMode-based output, temp file path for full output

### Files involved

- `.pi/extensions/run-async/index.ts` — main extension
- `.pi/extensions/run-async/logs/run-async.jsonl` — log file
- `_AI/guides/tools/run-async/how-to-use.md` — agent runbook guide
- `_AI/guides/patterns/agent-message-injection.md` — already documents the injection pattern
- `_AI/guides/rules/logging-standard.md` — already documents the logging pattern

## 🔗 Related Notes & Context

- [Agent Message Injection Pattern](../guides/patterns/agent-message-injection.md) — foundation pattern this builds on
- [Schedule Extension](../.pi/extensions/schedule/index.ts) — reference implementation for injection + retry
- [Logging Standard](../guides/rules/logging-standard.md) — mandatory logging rules
- [Dashboard Plan](../ai-dashboard/dashboard-plan.md) — async command runner feeds into dashboard

## 📋 Progress Log

- **[2026-05-27 22:45]**: Issue created — concept discussed, architecture sketched, ready for implementation next session
