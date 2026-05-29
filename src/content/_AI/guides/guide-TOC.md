# Guide Table of Contents

A single place to find every guide in this directory.

---

## Tools

How-to guides for specific tools, extensions, and utilities.

| Guide | Description |
|-------|-------------|
| [Schedule Extension](tools/schedule/how-to-use.md) | Timer/reminder system for agents. Set timers with duration or absolute time. The agent gets pinged when it fires. |

## Patterns

Reusable design patterns and mechanisms for building agent workflows.

| Guide | Description |
|-------|-------------|
| [Agent Message Injection](patterns/agent-message-injection.md) | The core mechanism that lets external code (timers, dashboards, watchers) inject messages into the agent's chat. Powers all async agent communication. |

## Rules

Mandatory development standards. These apply to every script in this vault.

| Guide | Description |
|-------|-------------|
| [Logging Standard](rules/logging-standard.md) | Every script MUST log. JSONL format, required fields, file location, rotation. Install logging first, logic second. |

---

> **To add a new guide**: Append a row to the appropriate table above with the guide name and a short description. Follow the steps in the [README](README.md#how-to-create-a-guide).
