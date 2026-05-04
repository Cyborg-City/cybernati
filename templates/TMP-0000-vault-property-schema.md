---
title: "{{title}}"
aliases:
draft: true
tags:
  - example-tag
ID:
type:
status:
clearance:
confidence:
mechanism:
primary_beneficiary:
created:
modified:
narrative_volatility:
source_provenance:
description:
related:
---

# Identification System

The **ID** property is the primary tracking key for the **Cybernati™** archive. It follows a strict prefix-and-increment system.

### ID Structure: `[PREFIX]-[0000]`
- **People**: `PER-0000`
- **Organizations**: `ORG-0000`
- **Places**: `PLC-0000`
- **Events**: `EVT-0000`
- **Claims**: `CLM-0000`
- **Evidence**: `EVD-0000`
- **Patterns**: `PAT-0000`
- **Dossiers**: `DOS-0000`
- **Timelines**: `TIM-0000`
- **Internal Memos**: `MEM-0000`

### Naming Convention
The filename must match the ID followed by a kebab-case descriptor.
*Example: ORG-0001-cia.md*

### Incrementing Logic
IDs must be incremented by one (+1) for every new entry in that category. Operatives must check the directory for the last used ID before creating a new one.

# Property Key Reference

Use these standardized values to maintain vault consistency and filterability.

## [status] - **Serious**
- **Active Review**: Currently being analyzed; high priority.
- **Legacy**: Historical record; unlikely to change.
- **Redacted**: Information withheld by administrative order.
- **Inactive**: No current signal detected.
- **Verified**: Confirmed by multiple independent sources.

## [clearance] - **Flavor**
- **Board Observer**: Absolute access; strategic oversight.
- **Records Associate**: Standard archival access.
- **Signals Operative**: Field-level data access.
- **External Contractor**: Limited, task-specific access.
- **Unauthorized Presence**: Narrative-only designation for leaked/stolen data.

> [!IMPORTANT] Flavor
> Clearance property is just for fun. 

## [confidence] - **Serious**
- **High**: Multiple primary sources; high reliability.
- **Mixed**: Contradictory reports; proceed with caution.
- **Low**: Single source or unreliable provenance.
- **Unverified**: Raw signal; no validation performed yet.

## [narrative_volatility] - **Serious**
- **Stable**: The public narrative is fixed and unchanging.
- **Drifting**: Subtle changes in public perception detected.
- **Volatile**: Rapidly changing; high risk of misinformation/psyops.
- **Suppressed**: Active efforts to remove this narrative from public view.

## [source_provenance] - **Serious**
- **Signal Capture**: Directly intercepted or observed by Cybernati Agents.
- **Leak**: Unauthorized release from within an organization.
- **Official Release**: Publicly acknowledged statement/document.
- **Open Source**: OSINT gathering from public records.
- **Clipping**: Web-based archival material.

## [mechanism] - **Serious**
- **Psychological Operation**: Influence via cognitive or emotional manipulation.
- **Administrative Suppression**: Control via bureaucracy, NDAs, or red tape.
- **Kinetic Encounter**: Physical interaction or incident.
- **Regulatory Capture**: Influence via control of oversight bodies.
- **Financial Leverage**: Control via economic pressure.
- **Technological Anomaly**: Interaction with unexplained hardware/physics.
