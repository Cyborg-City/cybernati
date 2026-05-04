# /research

Performs the Verification & Enrichment phase of the ingestion lifecycle.

## Instructions
1. **Bootstrap**: Read the draft notes in the current `Clippings/INGEST-*/` folder.
2. **Scan for Gaps**: Identify the following:
   - Claims with `confidence: Low` or `Unverified`.
   - Entities (People/Orgs) with missing descriptions or biographical data.
   - Opportunities for visual evidence (Images, Maps, Video URLs).
3. **Execute Search**: Use `google_web_search` and `web_fetch` to find missing information, primary sources, and media links.
13. **Enrich Drafts**: 
    - **MANDATORY**: Append a `## Citations & Sources` section to **every note**.
    - Embed Video or Image URLs if found (using Markdown or YouTube syntax).
   - Update `confidence` levels if claims are verified.
5. **Log**: Record the research findings in `agent-notes/agent-log.md`.
6. **Navigate**: Alert the User that the Enrichment is complete. **MANDATORY**: Ask: "Are you ready to run `/synthesize` to draft the Narrative Hub, or shall we perform further `/research`?"

## Example
`/research`
