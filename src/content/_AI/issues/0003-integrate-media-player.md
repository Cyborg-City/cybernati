# Issue: Integrate Native Media and Video Player Component in Astro

**Date Created**: 2026-05-25  
**Status**: Closed (Completed)  
**Severity**: low  
**Assigned To**: antigravity + lofi monk

---

## 📝 Objective & Architectural Concept

To support rich media research and documentation, the Cybernati site requires a highly professional, native media/video player component. The player must be designed to support both local colocated video assets (e.g. an MP4 file stored inside a folder-based Wiki or Dossier directory) and external streamed URLs (such as YouTube, Vimeo, or external CDN links).

Since the site has MDX enabled via Vault CMS, the media player should be exposed as a highly reusable Astro component (`<MediaPlayer />`) that authors can drop directly into `.mdx` content files or integrate directly into page layouts.

---

## 📋 Technical Requirements

### 1. Unified Interface (`<MediaPlayer />`)
The component should accept the following standard props:
* `src`: `string` (required) — Path to the media file. Supports:
  * Local colocated relative paths (e.g., `./telemetry-log.mp4`).
  * Vault attachment paths (e.g., `attachments/telemetry-log.mp4`).
  * External stream links (e.g., `https://www.youtube.com/watch?v=...` or raw CDN URLs).
* `poster`: `string` (optional) — Path to a preview thumbnail image.
* `caption`: `string` (optional) — A short caption displayed underneath the player.
* `aspectRatio`: `string` (optional, defaults to `"16/9"`) — Layout ratio controls.

### 2. Local Asset Path Resolution
* For folder-based collections (like `dossiers/` and `wiki/`), the build syncing script (`scripts/sync-images.js`) copies images and videos to public directory pathways.
* The `<MediaPlayer />` component must dynamically resolve local paths (like `./telemetry-log.mp4`) to their final synced public pathways (e.g. `/dossiers/uap-timeline/telemetry-log.mp4`), preventing broken media links.

### 3. Professional, Theme-Variable Compliant UI
* The player must build upon standard HTML5 `<video>` elements to ensure zero third-party script bloat, excellent accessibility, and fast load times.
* All controls, progress bars, play buttons, borders, and glassmorphic overlays must be styled cleanly using Tailwind classes referencing the site's global CSS theme variables (`primary-*`, `highlight-*`). The player's color accents must automatically swap when the active site theme is changed.
* Streamed embeds (like YouTube iframe fallbacks) should load lazily to ensure page load performance is not degraded.

---

## 🎯 Implementation Checklist

The developer agent executing this task must complete the following steps:

- [x] **1. Develop Component**: Create `src/components/MediaPlayer.astro` implementing the prop validation, path resolution, and styling.
- [x] **2. Integrate Path Resolver**: Extend the asset-syncing utility in `src/utils/images.ts` to support video extensions (`.mp4`, `.webm`, `.ogv`), ensuring files copy to the public directory during build.
- [x] **3. Style Layout**: Add custom CSS variables and Tailwind classes to style the native player controls to match the professional, high-contrast dark style of the active site theme.
- [x] **4. MDX Registration**: Export the component in the MDX MDX-rendering configuration so authors can type `<MediaPlayer src="..." />` directly inside markdown content without manual imports.
- [x] **5. Validation**: Create a test `.mdx` page in the sandbox containing local MP4 embeds and YouTube links. Verify that `pnpm run build` runs successfully and the player renders flawlessly on both mobile and desktop screens.

---

## 📋 Progress Log

* **[2026-05-25]**: Issue created to track the architectural design and implementation of standard media player components for colocated vault assets.
* **[2026-05-28]**: **Pinned** — Component and path resolver complete; remaining MDX registration and validation deferred for later polish.
* **[2026-05-29]**: **Closed** — Unified persistent global `CybernatiPlayer` implemented, fully refactored, and tested (103/103 tests passing). Navigational reloading and muting bugs resolved completely.
