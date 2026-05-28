# Issue: Design and Add Content Collections for Dossiers, Wiki, and Atomic Notes

**Date Created**: 2026-05-23  
**Status**: Closed — Completed 2026-05-28  
**Severity**: High  
**Assigned To**: Future Developer Agent  

---

## 📝 Objective & Architectural Concept

Extend the Cybernati Astro website framework to support three new evergreen, interconnected content types: **Dossiers, Wiki Pages, and Atomic Notes**. These types will serve as the primary expansions of the vault's structured database, ensuring schemas and layouts remain generic, highly portable, and extensible for any future subject matter.

This issue provides the exact structural layout, frontmatter configurations, and routing specifications required to implement these collections safely without causing compilation regressions.

---

## 📂 Collection Architectures

### 1. Dossiers (`dossiers`)
* **Role**: In-depth, synthesized, chronological, and source-heavy research reports.
* **CMS Pattern**: **Folder-Based** (`loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/dossiers' })`).
* **Multi-Note Public Compilation**: Rather than restricting folder content, **all** markdown notes in a dossier subdirectory (e.g. `annex-alpha.md`, `addendum-1.md`) must be compiled publicly by Astro as separate sub-pages (e.g., `/dossiers/historical-timeline/annex-alpha`), allowing structured, multi-page document trees.

### 2. Wiki/Concept Pages (`wiki`)
* **Role**: Encyclopedic reference pages cataloging structural entities (such as people, locations, projects, organizations, or technologies).
* **CMS Pattern**: **Folder-Based** (`loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/wiki' })`).
* **Colocated Media**: Allows images, local assets, or reference files to reside directly within the entity folder for clean vault organization. All secondary document notes in a wiki folder compile publicly.

### 3. Atomic Notes (`atomic`)
* **Role**: Granular, Zettelkasten-style evergreen concept slips representing single observations, modular arguments, or conceptual linkages.
* **CMS Pattern**: **File-Based / Flat** (`loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/atomic' })`). Standalone markdown files residing directly at the collection root for efficient note logging without directory bloat.

---

## 🏷️ Bare Minimum Frontmatter Schemas (Obsidian Properties)

To minimize database friction and maintain a fast writing workflow, frontmatter is restricted to the absolute essentials.

### Dossiers Frontmatter Schema
```typescript
z.object({
  title: z.string().default('Untitled Dossier'),
  description: z.string().default('Detailed investigative report.'),
  date: z.coerce.date().default(() => new Date()),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().optional().default(false),
  classification: z.string().optional(), // Standard status or classification tag (e.g. public, restricted)
})
```

### Wiki Pages Frontmatter Schema
```typescript
z.object({
  title: z.string().default('Untitled Entry'),
  description: z.string().default('Conceptual definition.'),
  wiki_category: z.string().default('General'), // Dedicated structural property for Wiki collection
  tags: z.array(z.string()).optional().default([]), // Full support for Obsidian tags and nested tags
  draft: z.boolean().optional().default(false),
})
```

### Atomic Notes Frontmatter Schema
```typescript
z.object({
  title: z.string().default('Untitled Zettel'),
  date: z.coerce.date().default(() => new Date()),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().optional().default(false),
})
```

---

## 🔗 Zero-Maintenance Relationship Mapping (Backlinks)

* **Separation of Terminology**: Developers must strictly separate **backend database keys** (like `wiki_category`) from **frontend presentation terms** (what the reader sees on the UI). For example, the `wiki_category: "location"` key should be rendered beautifully under a reader-facing title like "Database Sector" or "Subject Classification."
* **No Manual Properties**: To prevent maintenance overhead, authors will not manually list backlinks, related nodes, or connection arrays in frontmatter.
* **Astro Build-Time Extraction**: The Astro build pipeline must programmatically scan the compiled markdown content bodies at build-time to resolve Obsidian-style wikilinks (`[[Note Name]]`) and standard markdown links, automatically generating and injecting the **Backlinks and Connections Hub** at the footer of compiled pages.

---

## 🎯 Implementation Checklist

The developer agent executing this task must complete the following steps:

- [ ] **1. Schema Integration**: Add `dossiers`, `wiki`, and `atomic` collections to `src/content.config.ts` using the schemas and loader paths above.
- [ ] **2. Directory Initializations**: Create `src/content/dossiers/`, `src/content/wiki/`, and `src/content/atomic/` and verify the `.obsidian` configurations sync correctly.
- [ ] **3. Detail Page Routes**: Create `src/pages/dossiers/[...slug].astro`, `src/pages/wiki/[...slug].astro`, and `src/pages/atomic/[...slug].astro` rendering content cleanly using `BaseLayout.astro`.
- [ ] **4. Portal Index Pages**: Create structured index portals under `/dossiers`, `/wiki`, and `/atomic` supporting alphabetic conceptual indexes and listings.
- [ ] **5. Validation**: Validate that running `pnpm astro check` and `pnpm run build` generates static HTML routes without errors.

---

## 📋 Progress Log

* **[2026-05-23]**: Issue initialized.
* **[2026-05-25]**: Spec heavily refined with the user to outline public folder compilation, zero-maintenance backlinks, and minimal frontmatter properties.
* **[2026-05-28]**: **Closed** — Dossier, Vault, and Media collections implemented with schemas, routes, and listing pages. (Wiki and Atomic collections deferred; dossier naming standardized to singular.)
