# Theme Development Guide

This guide covers Astro Modular's architecture, including configuration, routing, rendering pipelines, and the internal structure of components and scripts.

## `siteConfig` — the configurability layer

`src/config.ts` is the **single source of truth** for theme behavior. Key sections:

- `site`, `title`, `description`, `author`, `language`
- `theme` + `availableThemes` + `customThemeFile`
- `fonts` — `{ source: "local" | "cdn", families: { body, heading, mono }, display }`
- `layout.contentWidth`
- `tableOfContents.{enabled, depth}`
- `footer`, `scrollToTop`, `hideScrollBar`, `featureButton`
- `deployment.platform` — `"netlify" | "vercel" | "github-pages" | "cloudflare-workers"`
- `commandPalette` — shortcut, placeholder, search scope, sections, quick actions
- `profilePicture`
- `navigation` — header + mobile menu + social icons
- **`optionalContentTypes`** — `{ projects: bool, docs: bool }` toggles whole content types
- `homeOptions` — `{ featuredPost, recentPosts, projects, docs, blurb }` controls the homepage
- `postOptions` — `{ postsPerPage, showPostCardCoverImages, postCardAspectRatio, linkedMentions, graphView, comments }`
- `features` — reading time, word count, tags, commandPalette, post navigation, etc.
- `seo.defaultOgImageAlt`
- `comments` — Giscus config (`repo`, `repoId`, `categoryId`, etc.)

### Config markers

Lines like `// [CONFIG:THEME]` directly above a value are read by the
**Astro Modular Settings Obsidian plugin** (`src/content/.obsidian/plugins/astro-modular-settings/`),
letting users edit config from inside Obsidian. **Do not remove, rename, or move these
markers.** When adding a new configurable value that should be editable from Obsidian,
add a `// [CONFIG:NEW_KEY]` marker on the line above it (uppercase, underscores).

## Swup — the big footgun

All page navigation goes through **Swup**, not Astro's `<ClientRouter />`. Swup swaps
DOM content inside `#swup-container` without firing `DOMContentLoaded`, so any
JavaScript that attaches event listeners or initializes components **must re-run after
every navigation**.

### The pattern

Every component that touches the DOM should:

1. Expose an `initializeX()` function on `window`.
2. Run it on `DOMContentLoaded`.
3. Be re-run from `BaseLayout.astro` in both `swup.hooks.on('page:view', ...)` and
   `swup.hooks.on('visit:end', ...)`.
4. Clean up existing listeners before re-attaching (clone-and-replace pattern, or
   `dataset.bound = 'true'` guards).

```js
// In component
function initializeMyComponent() {
  const el = document.querySelector('.my-component');
  if (!el) return;
  // tear down any previous state, then attach fresh listeners
}
window.initializeMyComponent = initializeMyComponent;
document.addEventListener('DOMContentLoaded', initializeMyComponent);

// In BaseLayout.astro — hook into BOTH events
window.swup.hooks.on('page:view', () => window.initializeMyComponent?.());
window.swup.hooks.on('visit:end', () => window.initializeMyComponent?.());
```

Components that need this: Table of Contents, Command Palette, theme toggle,
mobile menu, Mermaid diagrams, linked mentions, graph components.

### Scroll behavior — do NOT call `handleInitialHashScroll()` from `visit:end`

It forces `window.scrollTo(0, 0)` and fights the browser's native back/forward
scroll restoration. Swup is configured with `smoothScrolling: false`,
`plugins: []`, and `skipPopStateHandling: () => true` — let the browser handle
scroll restoration.

### Accessibility

`accessibility: false` is intentionally set in the Swup config to prevent it from
adding `tabindex` attributes to the body. Do not re-enable it.

### Don't add inline `<script>` tags

A plain `<script>` in a layout or component runs once on first load and never again.
Always go through the `initializeX()` + `window` + Swup hooks pattern.

## Special collection

`src/content/special/` contains fixed-URL pages handled by `[...slug].astro`:

| File | URL | Purpose |
|---|---|---|
| `special/home.md` | `/` | Homepage blurb content |
| `special/404.md` | `/404` | 404 page content |
| `special/posts.md` | `/posts` | Posts listing meta (title, description) |
| `special/projects.md` | `/projects` | Projects listing content |
| `special/docs.md` | `/docs` | Docs listing content |

Schema is simplified: `title`, `description`, `hideTOC`. URLs are determined by
filename, not frontmatter. These files are excluded from the `pages` collection.

All loading uses try/catch with fallbacks so missing files don't break the build.

## Remark / rehype plugin order — critical

In `astro.config.mjs`:

```javascript
remarkPlugins: [
  remarkInternalLinks,    // 1. wikilinks + standard links + URL mapping
  remarkBreaks,           // 2.
  remarkFolderImages,     // 3. ⚠️ rewrites image URLs, adds .webp — MUST skip non-image files
  remarkObsidianEmbeds,   // 4. audio / video / PDF / YouTube / Twitter
  remarkBases,            // 5.
  remarkImageCaptions,    // 6.
  remarkMath,             // 7.
  remarkCallouts,         // 8.
  remarkImageGrids,       // 9.
  remarkMermaid,          // 10.
  remarkReadingTime,      // 11.
  remarkToc,              // 12.
]

rehypePlugins: [
  rehypeKatex,            // 1. render math — MUST run first
  rehypeMark,
  rehypeSlug,
  rehypeAutolinkHeadings,
]
```

### The embed footgun

`remarkFolderImages` runs **before** `remarkObsidianEmbeds`. It processes every
image node in the AST (Obsidian embeds use image-node syntax), and naively adding
WebP conversion breaks audio/video/PDF embeds because their extensions get rewritten.

**`remarkFolderImages` MUST skip non-image extensions** (`.mp3`, `.wav`, `.ogg`,
`.m4a`, `.flac`, `.aac`, `.mp4`, `.webm`, `.mov`, `.mkv`, `.avi`, `.pdf`) so
`remarkObsidianEmbeds` can handle them.

Before modifying any remark plugin: trace the AST flow through the whole chain, and
test audio/video/PDF/YouTube/Twitter embeds after every change.

### Math — the KaTeX duplication bug

KaTeX renders both MathML (for accessibility) and HTML (visible fallback). If both
are visible, math appears twice (`E=mc²E=mc²`). The correct CSS is:

```css
.katex-mathml { display: inline-block !important; }
.katex-html   { display: none !important; }
```

**Never invert this.** MathML is the correct, accessible output.

## Graph view

Two components, both built on D3 force simulation:

- **`GraphModal.astro`** — full-screen global graph, opened from command palette.
  Keyboard: `Esc` close, `R` reset zoom, `C` center. Reads `/graph/graph-data.json`
  (generated at build time by `scripts/generate-graph-data.js`).
- **`LocalGraph.astro`** — 280×280 sidebar graph showing only directly-connected
  posts. Filters the same data source. Has a "fullscreen" button that opens the
  modal.

Colors come from `src/utils/graph-theme-colors.ts`, which reads CSS custom properties
and converts RGB to hex. Both components listen for `themechange` events and
re-render on theme switch. Use `getGraphThemeColors()` — never hardcode graph colors.

### Graph Click Navigation & Routing
- When implementing or updating graph node clicking, always use the `getGraphNodeUrl(slug)` helper function from `src/utils/url-helpers.ts`. This utility automatically prepends the correct subpath and appends a **trailing slash** (e.g. `/cybernati/posts/my-slug/`).
- On subdirectory static hosts (such as GitHub Pages), Swup's client-side AJAX requests return a **404 Not Found** if the trailing slash is missing.
- When re-rendering the Graph Modal on theme changes, make sure the event handler:
  1. Targets `#graph-modal-container` (NOT `#graph-modal-content`).
  2. Maps raw JSON connections to D3-compatible `GraphData` nodes and links before calling `renderGraph()`.
  3. Assigns to the outer scope `svg` variable (do NOT shadow it with `let svg = ...` inside `renderGraph`), otherwise the themechange event listener will verify `svg` (which remains `null`) and fail to trigger re-renders.

Graph nodes are **posts only**, filtered by `isPostLink`. Don't add other content
types without thinking carefully about scope.

## Themes (color themes)

17+ built-in themes in `src/themes/` plus user-customizable. Theme switching is
handled in `BaseLayout.astro`:

- Default theme: `siteConfig.theme`
- Available themes: `siteConfig.availableThemes` (`"default"` = all, or an array)
- Persistence: `localStorage.selectedTheme`
- Switching fires a custom `themechange` event that graphs and other components
  listen for
- CSS variables are stored as space-separated RGB: `"255 255 255"`
- Tailwind classes reference them via `primary-*` and `highlight-*` scales

When adding a new theme:
1. Add the definition to `src/themes/`
2. Register it in `src/themes/index.ts`
3. Add it to the `ThemeName` type in `config.ts`
4. Test in the command palette theme switcher

### Custom themes

Users can set `theme: "custom"` and `customThemeFile: "my-theme"` to load
`src/themes/custom/my-theme.ts`. The theme switcher only lists `custom` when the
config has `theme: "custom"`.

## Command palette

`src/components/CommandPalette.astro`. Default shortcut `Ctrl+K` (configurable via
`siteConfig.commandPalette.shortcut`). Sections:

- **Quick actions** — toggle dark mode, open graph, change theme
- **Pages / Posts / Projects / Docs** — fuzzy search (scope controlled by
  `commandPalette.search.*`)
- **Social links**

API endpoints in `src/pages/api/` feed the search. They must use `entry.id`, never
`entry.slug`. Theme switching goes through `window.changeTheme()` defined in
`BaseLayout.astro`.

## Table of contents

- **Posts** respect the global `tableOfContents.enabled` in config. Individual posts
  can opt out with `hideTOC: true` in frontmatter. They can't opt in when global is
  off.
- **Pages, projects, docs** have independent per-file TOC — default shown, hidden
  via `hideTOC: true`. Not affected by the global setting.

## Common scripts

| Command | What it does |
|---|---|
| `pnpm run dev` | Sync images + aliases + deploy config + graph data + `astro dev` (port 5000) |
| `pnpm run build` | Same pre-steps, production, + `astro build` |
| `pnpm run check-images` | Report missing image references |
| `pnpm run sync-images` | Manual asset sync |
| `pnpm run process-aliases` | Manual alias → redirect processing |
| `pnpm run generate-graph-data` | Rebuild `/graph/graph-data.json` |
| `pnpm run version` | Print current theme version |
