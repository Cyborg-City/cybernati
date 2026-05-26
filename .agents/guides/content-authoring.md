# Content Authoring Guide

This guide is for content creators and writers working within the Obsidian vault (`src/content/`). It covers how to structure content, format links, use embeds, and configure frontmatter for Astro Modular.

## Folder-based vs single-file content

**Every content type** supports both forms:

```text
posts/traditional-post.md              →  /posts/traditional-post/
posts/folder-based-post/index.md       →  /posts/folder-based-post/
posts/folder-based-post/cover.jpg      →  co-located asset
posts/folder-based-post/attachments/   →  Obsidian "subfolder" setting — stripped in output URLs
```

Same for `pages/`, `projects/`, `docs/`.

### Folder-based ID detection (Astro v6)

**In Astro v6, folder-based entries have IDs like `'folder-name'`, not `'folder-name/index'`.**
The old heuristic `post.id.includes('/') && post.id.endsWith('/index')` will never
match. Detect folder-based posts by:
- Checking if `image` frontmatter points to a co-located file (not `attachments/`)
- Using a known list
- Checking the filesystem server-side

### Asset sync

`scripts/sync-images.js` copies co-located assets from `src/content/{type}/{slug}/`
to `public/{type}/{slug}/` before every dev and build. Supported:
images (jpg/png/webp/svg/…), audio (mp3/wav/…), video (mp4/webm/…), PDF.

Images in `attachments/` subfolders are flattened — `attachments/image.png` is copied
as `image.png` in the output. This prevents breakage when users toggle Obsidian's
attachment-subfolder setting.

## Internal links — the most important section

Astro Modular supports **two linking styles** in markdown, both handled by remark
plugins in `src/utils/internallinks.ts`:

### Wikilinks — posts only

```markdown
[[Post Title]]
[[Post Title|Custom Display Text]]
![[image.jpg]]
![[audio.mp3]]
```

- Scope: **posts only.** Wikilinks to pages / projects / docs do not resolve.
- Implemented by `remarkWikilinks()`.

### Standard markdown links — all content types

```markdown
[Post](posts/some-slug)
[Page](pages/about)        →  rewritten to /about
[Project](projects/my-thing)
[Doc](docs/getting-started)
[Home](special/home)       →  rewritten to /
[404 Page](special/404)    →  rewritten to /404
[Section](#heading-slug)
```

- Scope: **all content types.**
- Implemented by `remarkStandardLinks()`. Combined with wikilink handling by
  `remarkInternalLinks()`.

### URL mapping (rendering only)

Obsidian-native paths get rewritten to web URLs during markdown compilation:

| Markdown link | Rewritten to |
|---|---|
| `/pages/about` or `pages/about` | `/about` |
| `/special/home` or `special/home` | `/` |
| `/special/404` | `/404` |
| `/special/posts` | `/posts` |
| `/pages/about#section` | `/about#section` |

The mapping logic is `mapRelativeUrlToSiteUrl()` in `internallinks.ts`. Trailing slashes,
leading slashes, and anchors are all normalized. Don't manually rewrite Obsidian-style
paths to site paths — let the rewriter do it.

### URL mapping is for RENDERING ONLY

**Linked Mentions** and the **graph view** remain posts-only — they filter via
`isPostLink` regardless of URL mapping. URL mapping does not expand the scope of
those features.

### Best practice

Prefer **standard markdown links** (`[text](url)`) for cross-content-type links.
Use wikilinks only when exclusively linking between posts and you want the
Obsidian-native feel.

## Aliases & redirects (renaming content)

Astro Modular supports the **`file-name-history`** Obsidian plugin (bundled). When you
rename a file in Obsidian, the old filename is stored as an `aliases:` entry in the
frontmatter. The `scripts/process-aliases.js` build step reads these and generates
redirect rules for the deployment platform.

```yaml
---
title: Vault CMS Guide
aliases:
  - obsidian-vault-guide
---
```

**Users almost never do anything manually — just rename in Obsidian and it works.**

If a link points to a slug that doesn't exist, check whether the target file has the
old slug in its `aliases:` array before assuming the link is broken. **Don't
fuzzy-match** and rewrite links to renamed content.

## Obsidian embeds

Handled by `remarkObsidianEmbeds` in `src/utils/remark-obsidian-embeds.ts`:

| Type | Syntax | Output |
|---|---|---|
| Audio | `![[audio.mp3]]` | HTML5 `<audio>` with controls |
| Video | `![[video.mp4]]` | HTML5 `<video>` with 16:9 aspect ratio |
| YouTube | `![](https://youtube.com/watch?v=ID)` | Responsive iframe |
| PDF | `![[doc.pdf]]` or `![[doc.pdf#page=3]]` | iframe viewer + download link (preserves `#page=N`) |
| Twitter/X | `![](https://twitter.com/u/status/ID)` | Twitter widget embed |

External URLs (YouTube, Twitter) are processed **before** attachment URLs to avoid
conflicts. Pipe syntax (`|alt`) and fragments are stripped before processing, except
for PDFs where `#page=N` is preserved.

### Platform headers for PDF + Twitter

PDF iframes need `X-Frame-Options: SAMEORIGIN`. Twitter widgets need the right
Content-Security-Policy. `scripts/generate-deployment-config.js` writes the correct
headers into `netlify.toml` / `vercel.json` / `public/_headers` based on
`deployment.platform`.

## Image system — two completely separate pipelines

Do not confuse these:

### 1. Post card images (listings, homepage, tag pages)

- Controlled by `postOptions.showPostCardCoverImages` in `config.ts`
- Options: `"all" | "featured" | "home" | "posts" | "featured-and-posts" | "none"`
- Source: `image` frontmatter field
- **Not affected by `hideCoverImage` frontmatter**
- First card on each listing should use `eager={true}` (LCP)

### 2. Post / page / project / doc content images (inside the detail page)

- Controlled by `hideCoverImage` frontmatter field
- Always `loading="eager"` + `fetchpriority="high"` when rendered
- Rendered by `PostContent.astro` / layout components

Project and doc cards always show their cover when available (independent of
`showPostCardCoverImages`), controlled by their own `hideCoverImage` frontmatter.

### Post card aspect ratio

`postOptions.postCardAspectRatio`: `"og" | "16:9" | "4:3" | "3:2" | "square" | "golden" | "custom"`.
Only affects cards, never individual post cover images.

### Image references in markdown

```markdown
![Alt](image.jpg)              # relative — preferred
![Alt]([[image.jpg]])          # Obsidian bracket syntax — also supported
```

Image resolution:
- Relative (`image.jpg`) → `/posts/{slug}/image.jpg`
- Absolute (`/attachments/foo.jpg`) → as-is
- External URL → as-is
- Cover images auto-convert to `.webp` via the URL resolver (except SVG / existing WebP)

### Missing images

Dev mode shows placeholders and logs a warning — production builds fail. Run
`pnpm run check-images` before deploying.

## H1 titles

**Both posts and pages hardcode the H1 from frontmatter `title`** in their layouts.
Content markdown should **never start with `# Title`** — start with `##`. Same goes
for projects and docs.

## Frontmatter reference

### Posts

```yaml
---
title: "My Post"
description: "One-sentence summary"
date: 2025-01-15
tags: [productivity]
image: "cover.jpg"          # optional, cover image
imageAlt: ""
imageOG: false              # use cover as OG image instead of generating
hideCoverImage: false
hideTOC: false
targetKeyword: ""           # SEO plugin
draft: false
aliases:                    # populated by file-name-history
  - old-slug
---
```

### Pages

```yaml
---
title: "About"
description: ""
hideCoverImage: false
hideTOC: false
noIndex: false
draft: false
---
```

### Projects

```yaml
---
title: "Cool Thing"
description: ""
date: 2025-01-15
categories: ["Web Development"]
repositoryUrl: "https://github.com/..."
demoUrl: "https://..."
status: "completed"         # any string — "completed", "in-progress", "On Hold", etc.
image: "cover.jpg"
imageAlt: ""
hideCoverImage: false
hideTOC: false
draft: false
featured: true              # show on homepage if homeOptions.projects.enabled
---
```

### Docs

```yaml
---
title: "Getting Started"
description: ""
category: "Setup"           # optional — missing categories fall into "Unsorted"
order: 1                    # sort order within category
lastModified: 2025-01-15
version: "1.0.0"
image: "hero.jpg"
hideCoverImage: false
hideTOC: false
draft: false
featured: true
---
```
