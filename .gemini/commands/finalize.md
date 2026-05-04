# /finalize

**Phase 3: The Production Merge**

## Instructions
1. **Bootstrap**: 
   - Read `private/vault-schema.md` to confirm ID prefixes and naming rules.
   - Identify the active staging folder in `Clippings/` (e.g., `INGEST-20260503-Roanoke/`).
2. **Sequence Check**: 
   - Scan the `content/` directories (Evidence, People, Orgs, etc.) to determine the absolute next ID for each category (e.g., if `EVD-0001` exists, the next is `EVD-0002`).
3. **The Precision Merge**:
   - **Move**: Transfer all drafted `.md` files from the staging folder to their permanent `content/` sub-directories.
   - **Identity**: Rename each file from `TEMP` to its final `ID-####-kebab-case.md` name.
   - **Refactor**: Update the internal `ID:` property and all `[[Wikilinks]]` within the files to use the new, finalized IDs.
4. **Log & Audit**: 
   - Append the final mapping (Draft Name -> Final ID) to `agent-notes/agent-log.md`.
5. **Sanitization**: 
   - Delete the empty staging folder and the `report.md`.
6. **Completion**: 
   - Inform the User: "The Sequence is finalized. The System is performing as intended."
