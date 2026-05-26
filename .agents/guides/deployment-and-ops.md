# Deployment & Ops Guide

This guide covers how Astro Modular is deployed, integrated with third-party services like Giscus, and the bundled Obsidian plugins that support the editing environment.

## Deployment

Set `siteConfig.deployment.platform` once and `pnpm run build` writes the right
config files:

| Platform | Generates |
|---|---|
| `"netlify"` | `netlify.toml` |
| `"vercel"` | `vercel.json` (merges with existing — preserves custom settings) |
| `"github-pages"` | `public/_redirects`, `public/_headers` (gitignored) |
| `"cloudflare-workers"` | `wrangler.toml` (Workers-format, using `assets.directory`), `_redirects`, `_headers` |

Switching platforms cleans up the files for the old platform but **never touches**
`netlify.toml` / `vercel.json` / `wrangler.toml` (may contain custom bindings).
`_redirects` and `_headers` in `public/` are considered build artifacts and get
cleaned / regenerated.

No environment variables needed. The legacy `DEPLOYMENT_PLATFORM=...` env var still
works but isn't recommended.

## Comments (Giscus)

`features.comments: true` enables Giscus comments via GitHub Discussions. Config
lives under `siteConfig.comments`. Setup: enable Discussions on the repo → create a
category → get repo ID + category ID from [giscus.app](https://giscus.app) → fill in
`comments.repo`, `comments.repoId`, `comments.categoryId`.

Comments use `mapping: "pathname"` + `strict: "0"`, which auto-creates a
discussion on first comment. No manual setup per post needed.

## Bundled Obsidian plugins

Located in `src/content/.obsidian/plugins/`. The important ones for AI agents:

| Plugin | Role |
|---|---|
| `vault-cms` | The CMS / publishing pipeline itself |
| `astro-modular-settings` | Edits `siteConfig` from Obsidian, reads `[CONFIG:KEY]` markers |
| `astro-composer` | Creates new posts/pages with correct frontmatter, kebab-case rename |
| `file-name-history` | Auto-populates `aliases:` frontmatter when renaming files |
| `nested-properties` | Nested YAML frontmatter support |
| `property-over-file-name` | Use `title` frontmatter as primary identifier |
| `bases-cms`, `home-base` | Obsidian Bases integration + homepage |
| `image-manager` | Image insertion + optimization |
| `tag-wrangler` | Renames tags across the vault |
| `obsidian-git` | Commit + push from inside Obsidian |
| `seo`, `omnisearch` | SEO checks, better search |

If you change anything that touches frontmatter conventions, image paths, link
rewriting, or `[CONFIG:KEY]` markers, **double-check the corresponding plugin still
works**.
