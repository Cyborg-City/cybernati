---
updated: 2026-05-03T14:30:21-05:00
---
# Vault Schema

## Directory Classification

To maintain structural integrity, directories are divided into **Serious (Functional)** data storage and **Flavor (Narrative)** analysis.

### Serious (Functional) — The Atomic Core
These directories store primary facts and source-linked data. Accuracy is paramount.
- **Evidence** (EVD) → Raw source summaries, clippings, and documents.
- **People** (PER) → Biographical data on recurring actors.
- **Organizations** (ORG) → Systems of power, agencies, and corporate entities.
- **Places** (PLC) → Geographic anchors and site-specific data.
- **Events** (EVT) → Specific moments in time/incidents.
- **Timelines** (TIM) → Chronological sequencing of verified data.

### Flavor (Narrative) — The Cybernati™ Lens
These directories are for synthesis, speculation, and the "Machine beneath the Machine" interpretation.
- **Claims** (CLM) → Specific narratives, hypotheses, or "theories" regarding events.
- **Patterns** (PAT) → Cross-case insights and systemic observations.
- **Dossiers** (DOS) → Curated, strategic synthesis of multiple entities.
- **Internal Memos** (MEM) → Agent-authored notes, briefings, and internal comms.

## Files

Files should start with an ID followed by a four-digit number. Starting at `0000` and using kebab-case.       

- **People** → `PER-0000-name.md`
- **Organizations** → `ORG-0000-name.md`
- **Places** → `PLC-0000-name.md`
- **Events** → `EVT-0000-name.md`
- **Claims** → `CLM-0000-name.md`
- **Evidence** → `EVD-0000-name.md`
- **Patterns** → `PAT-0000-name.md`
- **Dossiers** → `DOS-0000-name.md`
- **Timelines** → `TIM-0000-name.md`
- **Internal Memos** → `MEM-0000-name.md`

All file names must be incremented by one (+1) each time a new file is created in that category.

## Frontmatter

All files must adhere to the property schema defined in:
[[TMP-0000-vault-property-schema]]
