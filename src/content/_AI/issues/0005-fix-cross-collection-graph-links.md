# Issue: Fix Cross-Collection Graph Links (Node ID Mismatches)

**Date Created**: 2026-05-29  
**Status**: Open  
**Severity**: Medium  
**Assigned To**: Antigravity

---

## 📝 Description

The local and global graph views fail to connect nodes across different content collections (e.g. `posts`, `dossier`, `vault`), even when they are directly linked in markdown content via wikilinks or standard markdown links.

### Root Cause
During graph data compilation in `scripts/generate-graph-data.js`:
1. When extracting wikilinks, the script calls `generateNodeId(baseLink, "posts")` (where `baseLink` might be `"dossier/the-project-pursue-reference-dossier"`).
2. Because it hardcodes `"posts"` as the second argument, `generateNodeId` attempts to replace `src/content/posts/` from the path (which does not exist in the wikilink string).
3. The resulting target ID is slugified into `"dossier-the-project-pursue-reference-dossier"`.
4. However, when the dossier node itself is compiled, its ID is read from the content collection, yielding `"the-project-pursue-reference-dossier"`.
5. Since the link slug (`"dossier-the-project-pursue-reference-dossier"`) does not match the actual node ID (`"the-project-pursue-reference-dossier"`), the connection is silently discarded.

---

## 🎯 Goals & Requirements

- [ ] **Accurate Slug Resolution**: Ensure that wikilinks and standard links referencing any collection (`posts`, `dossier`, `vault`, etc.) have their collection prefixes parsed and stripped correctly during graph data generation, matching the way `src/utils/internallinks.ts` resolves links.
- [ ] **Cross-Collection Link Extraction**: Update `extractWikilinks()` and `extractStandardLinks()` in `scripts/generate-graph-data.js` to correctly identify the target collection and resolve the target node ID.
- [ ] **Robust matching**: Ensure that standard links (e.g., `[label](/dossier/slug)` or `[label](dossier/slug.md)`) and wikilinks (e.g., `[[dossier/slug]]` or `[[slug]]`) successfully resolve to their correct target node IDs.
- [ ] **TDD Validation**: Write unit tests for the graph connection helper functions (such as `generateNodeId`, `extractWikilinks`, `extractStandardLinks`) before implementing the fix.
- [ ] **Verification**: Build the site (`pnpm run build`) and run `node scripts/generate-graph-data.js` to confirm that the compiled `graph-data.json` successfully maps connections between notes in different collections.

---

## 🛠️ Proposed Solution / Implementation Details

1. Refactor `generateNodeId` and link-extraction helpers in `scripts/generate-graph-data.js` to recognize all configured collections (`posts`, `dossier`, `vault`) rather than hardcoding `"posts"`.
2. Extract and strip the collection prefix dynamically when resolving the target ID, aligning with `src/utils/internallinks.ts`.
3. Add a dedicated test suite (e.g., in a test file using the repository's test runner, or a custom script) to assert correct node ID generation for cross-collection links.

---

## 📋 Progress Log

- **[2026-05-29 18:15]**: Issue created after analyzing `scripts/generate-graph-data.js` and identifying node ID mismatches between parsed link targets and entry IDs.
