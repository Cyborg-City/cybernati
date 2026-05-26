# Adding a New Collection in Astro Modular

## The Story So Far

Astro Modular is fundamentally built around treating an Obsidian Vault as a CMS. The default setup assumes standard collections like `posts`, `pages`, `projects`, and `docs`. When extending this template to support additional organizational concepts—like custom `dossier` or `vault` collections—we've learned some hard lessons about the project's tightly coupled internal systems.

Because Obsidian relies on a unified pool of notes (where everything can link to everything via wikilinks, tags, and the graph), creating a segregated Astro collection breaks many of these assumptions if we only add it to `content.config.ts`. 

For example:
- **Routing & Navigation:** Astro handles routing via `src/pages`. If we don't define a route for the collection, the notes will yield a `404`. While there is a generic `src/pages/[collection]/[...slug].astro` catch-all route, we must ensure the collection name isn't accidentally excluded, or explicitly create a directory like `src/pages/dossier`.
- **Wikilinks & Internal Links:** Both the Astro layouts (e.g., `PostLayout.astro`, `DossierLayout.astro`) and `src/utils/internallinks.ts` must be updated to aggregate notes across *all* collections. If the new collection is missing from the unified array (e.g. `[...allPosts, ...allDossiers, ...allVaults]`), wikilinks pointing to the new collection will render as broken links.
- **The Graph View:** The local graph relies on a pre-generated JSON file. The script `scripts/generate-graph-data.js` was originally hardcoded to only index the `src/content/posts` folder. Adding a new collection meant the notes were completely isolated from the graph unless we updated the node.js generation script to parse the new directories and recognize the new path formats (e.g., `dossier/my-note` instead of just `posts/my-note`).
- **Layouts & Settings:** When duplicating layouts (like creating `DossierLayout.astro` from `PostLayout.astro`), logic like `LocalGraph` checks and `hasLocalGraphConnections` require the graph JSON to be aware of the exact node ID.

In short, adding a collection is not just an Astro feature—it is a full-stack addition spanning configuration, layout rendering, link resolution, and Node.js indexing scripts.

---

## Step-by-Step Guide to Adding a Collection

Follow these steps carefully to integrate a new collection seamlessly into the site ecosystem.

### 1. Register the Collection
**File:** `src/content.config.ts`
- Import `defineCollection`, `z`, and `glob`.
- Define your new collection schema.
- Export it in the `collections` object.

### 2. Update Link Resolution Utilities
**File:** `src/utils/internallinks.ts`
- If internal link tools are explicitly querying collections, ensure your new collection is included in the unified search pool so that standard links and wikilinks don't break.

### 3. Handle Routing & Pages
**Directory:** `src/pages`
- **Option A (Generic Routing):** Ensure your collection relies on `src/pages/[collection]/[...slug].astro`. (Note: This defaults to rendering via `PostLayout.astro`).
- **Option B (Custom Routing):** Create a specific directory (e.g., `src/pages/dossier/`) with `index.astro`, `[...slug].astro`, and potentially `tag/[tag].astro`.

### 4. Create or Update Layouts
**Files:** `src/layouts/PostLayout.astro`, `src/layouts/YourCustomLayout.astro`
- If you made a custom layout, ensure the global array that resolves wikilinks at runtime is updated:
  ```javascript
  const [allPosts, allNewCol] = await Promise.all([
    getCollection('posts'),
    getCollection('your-new-collection')
  ]);
  const visiblePosts = [...allPosts, ...allNewCol];
  ```
- This `visiblePosts` array is passed to client-side scripts to parse `[[wikilinks]]`.

### 5. Update Graph Data Generation (CRITICAL)
**File:** `scripts/generate-graph-data.js`
- By default, this script only looks at `src/content/posts`.
- You **must** update the `COLLECTIONS_TO_INDEX` (or the folder iteration loop) to include your new collection folder.
- You **must** update link parsing logic (`extractStandardLinks`, `isInternalLink`, `extractLinkTextFromUrl`) so it understands paths prefixed with your new collection (e.g., `your-new-collection/note`).
- *Failure to do this means the graph view sidebar will be missing for your collection's notes.*

### 6. Update Configuration & Site Settings (Optional but Recommended)
**File:** `src/config.ts`
- If your collection needs toggleable features (comments, graph view, reading time), add them to `siteConfig`.
- **WARNING:** Do not rename or remove the `// [CONFIG:KEY]` comment markers, as the Obsidian plugin relies on them.

### 7. Run Scripts and Verify
- Run `node scripts/generate-graph-data.js` and verify your collection nodes appear in `public/graph/graph-data.json`.
- Run the dev server (`pnpm dev`) and verify:
  1. A note from your collection renders without a 404.
  2. Wikilinks pointing to the note resolve properly.
  3. The local graph appears on the left sidebar.
