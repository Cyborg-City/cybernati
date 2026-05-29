# AGENTS.md — Astro Modular (Astro + Obsidian blog theme)

Source of truth for AI agents (Claude Code, Cursor, etc.) working in this repo.
**Read this entire file before making changes.** It captures the things that are
non-obvious about how Astro Modular is structured.

If the answer to "how does X work?" isn't here and it took you more than one round of
investigation, **add it here** when you figure it out.

---

## What Astro Modular is

Astro Modular is an Astro blog theme designed for Obsidian users, by
[David V. Kimball](https://davidvkimball.com). The `src/content/` folder is a real
Obsidian vault — users write in Obsidian, commit, and publish.

**Stack:**
- Astro 5.x (fully prepared for v6). Netlify / Vercel / GitHub Pages / Cloudflare Workers friendly.
- **Obsidian vault as CMS.** `src/content/.obsidian/` is committed, with a curated plugin set.
- **Swup** for client-side page transitions (NOT Astro's ClientRouter).
- Tailwind + custom theme variables (17+ built-in color themes, switchable at runtime).
- Vanilla JS only — no React, no jQuery.
- Modular by design — almost every feature toggles via `siteConfig` in `src/config.ts`.

**Core philosophy:** Content lives in Obsidian. Standard markdown links, wikilinks,
Obsidian embeds, callouts, and tags should work *identically* in Obsidian and on the
live site. Don't take shortcuts that break Obsidian-native behavior.

---

## Cardinal rules

1. **NEVER edit files in `src/content/`** without explicit user permission. Posts,
   pages, projects, docs, frontmatter — all belong to the user. Only edit config,
   components, layouts, utilities, scripts, and plugins.
2. **Use `pnpm`, not `npm`.** Scripts: `pnpm run <script>`.
3. **Use `entry.id`, NEVER `entry.slug`.** `slug` is removed in Astro v6 and returns
   `undefined`. Folder-based entries have IDs like `'folder-name'`, NOT `'folder-name/index'`.
4. **Never disable the Astro dev toolbar** (`devToolbar.enabled: true` in
   `astro.config.mjs`). The pnpm module-loading errors in the console are cosmetic.
5. **Never disable `vite.server.fs.strict`.** Security boundary.
6. **Never use `console.log()` in production code.** Use `src/utils/logger.ts`.
7. **Never hardcode colors.** Use Tailwind classes that reference theme variables
   (`primary-*`, `highlight-*`) with `dark:` variants. The theme system has 17+ color
   themes — hardcoded colors break all of them.
8. **Never remove or rename `// [CONFIG:KEY]` comment markers** in `src/config.ts`.
   The Astro Modular Settings Obsidian plugin uses them to edit config from inside
   the vault.
9. **Never use destructive commands** (`rm -rf`, `git reset --hard`, force push)
   without explicit approval. Investigate root causes.
10. **Match existing patterns.** This codebase already solves most problems consistently.
    Search before inventing.
11. **ALWAYS USE TDD (Red, Green, Refactor)**: A failing test must be written first before writing any functional/implementation code.
12. **Software Design Principles**: Always write code using DRY (Don't Repeat Yourself) and SOLID design principles. Write DAMP (Descriptive and Meaningful Phrases) tests, and strictly adhere to the Beyonce rule ("If you liked it, then you shoulda put a test on it").
13. **TSDoc / Explaining the "Why"**: Always write TSDoc-style comments explaining the architectural and logical "why" behind your code changes and helper functions.

---

## Repo layout

```text
src/
  content/
    posts/{slug}.md OR posts/{slug}/index.md      # Both forms supported
    pages/{slug}.md OR pages/{slug}/index.md      # e.g. about, contact
    projects/{slug}.md OR projects/{slug}/index.md
    docs/{slug}.md OR docs/{slug}/index.md
    special/{name}.md                             # home, 404, posts, projects, docs — fixed-URL pages
    bases/                                        # Obsidian Bases (.base) files
    .obsidian/                                    # Real vault: config + plugins, committed
  content.config.ts                               # Astro v6 location — DO NOT move back to src/content/config.ts
  config.ts                                       # siteConfig — single source of truth for theme behavior
  themes/                                         # 17+ color theme definitions
  layouts/
    BaseLayout.astro                              # Swup container, theme init, global JS re-init hooks
    PostLayout.astro                              # Hardcodes H1 from frontmatter
    PageLayout.astro                              # Hardcodes H1 from frontmatter
    ProjectLayout.astro
    DocumentationLayout.astro
  pages/
    index.astro                                   # Homepage
    posts/, projects/, docs/                      # Listings + detail routes
    [...slug].astro                               # Catch-all for pages + special
    api/                                          # JSON endpoints for command palette
    rss.xml.ts, feed.xml.ts, sitemap.xml.ts, llms.txt.ts, robots.txt.ts
  utils/
    internallinks.ts                              # Link rewriter (wikilinks + standard links + URL mapping)
    logger.ts                                     # Use instead of console.log
  components/                                     # PostCard, ImageWrapper, CommandPalette, GraphModal, LocalGraph, etc.
scripts/
  sync-images.js                                  # Copies co-located assets to public/
  process-aliases.js                              # Converts frontmatter aliases → redirects
  generate-deployment-config.js                   # Writes netlify.toml / vercel.json / wrangler.toml / _redirects
  generate-graph-data.js                          # Builds /graph/graph-data.json
  check-missing-images.js                         # `pnpm run check-images`
```

---

## Role-Based Guides

Because Astro Modular has many moving parts, the detailed instructions are split by role. **Read the guide most relevant to your current task.**

* [Content Authoring Guide](.agents/guides/content-authoring.md)
  * Folder-based vs single-file content
  * Internal links, aliases, redirects
  * Obsidian embeds and Image system
  * Frontmatter references
* [Theme Development Guide](.agents/guides/theme-development.md)
  * `siteConfig` and Swup
  * Remark / rehype plugins
  * Graph view, Themes, Command palette
* [Deployment & Ops Guide](.agents/guides/deployment-and-ops.md)
  * Deployment targets (Netlify, Vercel, GH Pages)
  * Giscus comments
  * Bundled Obsidian plugins

---

## When in doubt

- **Read the existing pattern first.** Search the codebase before inventing.
- **Consult this file before guessing.** If something isn't documented here, that's
  a bug in this file — fix it after you figure it out.
- **Ask before doing anything destructive or large-scale.**
- **Test after Swup navigation.** Initial load is not enough. Navigate to a page,
  then to another, then back — confirm the feature still works.
- **Don't break the Obsidian-native experience.** Wikilinks, standard links,
  embeds, callouts, and tags must look and behave the same in Obsidian and on the
  live site.
- **Prefer configurability over hardcoding.** Astro Modular is a template — users
  customize everything.
