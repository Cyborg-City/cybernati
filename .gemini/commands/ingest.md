# /ingest [source_path]

**Phase 1: Forensic Extraction**

## Instructions
1. **Bootstrap**: Read `.gemini/GEMINI.md` and `private/Ingestion Protocol.md` to internalize the Cybernati™ research standards.
2. **Log & Stage**: 
   - Record the start in `agent-notes/agent-log.md`.
   - Create staging directory: `Clippings/INGEST-[YYYYMMDD]-[NAME]/`.
3. **Extraction**: 
   - Read the source document(s) at `[source_path]`.
   - Extract key Entities: **People, Places, Things, and Events** that play a key role in the signal.
4. **Report**: Write `report.md` in the staging folder. Use these three lenses to start a conversation with the user:
   - **Factual** — The raw facts, ground truth. What's actually happening? What's the data say?
   - **Institutional** — Who's involved? What organizations, groups, or institutions are part of this?
   - **Systemic** — What's the bigger picture? What systems are at play? What's the broader context?
5. **Drafting (Obsidian CLI)**:
   - Use the **Obsidian CLI** to create the draft files for every entity.
   - **EXPLICIT COMMAND**: `obsidian create path="Clippings/INGEST-[YYYYMMDD]-[NAME]/TEMP-[entity-name].md" template="TMP-0000-vault-property-schema-key"`
   - **MANDATORY**: You MUST use the `template="TMP-0000-vault-property-schema-key"` flag. This ensures the correct Cybernati™ property keys are pre-populated.
   - **Placeholder IDs**: Set `ID: PER-TEMP`, `ID: ORG-TEMP`, etc., inside the files to allow inter-linking within staging without clashing with the main vault.
6. **Navigate**: Alert the User that the Forensic Packet is ready. **MANDATORY**: Ask: "Are you ready to run `/research` to verify claims and add citations, or shall we discuss the Forensic Signal in the `report.md` further?"
