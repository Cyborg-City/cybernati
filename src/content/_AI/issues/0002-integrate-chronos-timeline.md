# Issue: Integrate Chronos Timeline Markdown Parser into Astro Build

**Date Created**: 2026-05-25  
**Status**: Open (Pinned)  
**Severity**: Medium  
**Assigned To**: Antigravity

---

## 📝 Objective & Architectural Concept

To maintain a 1:1 layout match between the local Obsidian vault and the published live site, Astro must be configured to parse and render `chronos` codeblocks. Chronos is an Obsidian plugin that allows authors to write structured timelines in plain markdown codeblocks. 

Currently, these blocks render as raw, unformatted code blocks on the Astro live site. We have decided **not to use the npm library `chronos-timeline-md`** (which relies on a heavy client-side `vis.js` runtime), as it would introduce client-side bloat, styling friction with our 17+ HSL theme variables, and page-transition bugs under Swup.

Instead, we will build a **custom, lightweight, static build-time parser from scratch** (via a custom Remark plugin). It will compile `chronos` code blocks directly into responsive, highly-styled semantic HTML/CSS, guaranteeing:
* **Zero Client-Side JS**: Ultimate loading speeds and zero browser overhead.
* **Flawless HSL Theme Variable Styling**: Beautiful dark/light mode accents out-of-the-box.
* **Seamless Swup SPA Transitions**: Static nodes require no re-initialization scripts.
* **100% Obsidian Compatibility**: Obsidian renders interactive timelines locally, while the live website builds premium responsive layouts.

---

## 🔗 Design Inspiration & Reference

* **Knight Lab TimelineJS**: [https://timeline.knightlab.com/](https://timeline.knightlab.com/) — High-fidelity historical media timelines. We will draw design inspiration from Knight Lab's clean spacing, bold milestone layouts, and semantic event groupings to build a premium, state-of-the-art visual presentation for the sidebar and mobile overlays.

---

## 📋 Syntax Specification

The parser must support the standard Chronos markdown syntax:

```text
date: Event Title
- Bullet point describing the event
- Another supporting detail
```

For example, a live note might contain:

```chronos
1896: Mystery Airship Sighting
- Thousands report electric searchlights across North America.
- Thomas Edison issues press denials.
1944: Allied Foo Fighters
- Night pilots report orange plasma spheres over France.
```

---

## 🛠️ Proposed Solution & Technical Workflow

1. **Astro Config Hook**:
   * Add a custom Remark/Rehype plugin or a custom component handler in `astro.config.mjs` to intercept markdown codeblocks with the language tag `chronos`.
2. **Text Parsing Utility**:
   * Write a lightweight JavaScript parser inside `src/utils/chronos.ts` to process the block string:
     * Split text by lines.
     * Use regular expressions to extract `date` (everything before the colon) and `title` (everything after the colon).
     * Group any subsequent lines starting with `-` as child descriptions for that node.
3. **Tailwind/CSS Rendering**:
   * Output the parsed timeline as structured, responsive HTML (e.g. an vertical timeline axis with glowing nodes and adaptive borders).
   * Ensure all colors use HSL theme variables (`primary-*`, `highlight-*`) so the layout automatically adapts to runtime changes.

---

## 🎯 Implementation Checklist

The developer agent executing this task must complete the following steps:

- [ ] **1. Create Parser Utility**: Develop the string parsing logic in `src/utils/chronos.ts` and add unit tests to verify robust handling of multi-line bullet points.
- [ ] **2. Register Markdown Plugin**: Configure `astro.config.mjs` to intercept `chronos` codeblocks, parse them, and attach the structured data to page frontmatter.
- [ ] **3. Style Layout**: Design and build a `<TimelineSidebar />` component leveraging global CSS variables and Knight Lab design inspiration.
- [ ] **4. Build Validation**: Add a test page with a complex Chronos timeline to verify that `pnpm run build` compiles without errors and matches the expected layout.
- [ ] **5. Obsidian Verification**: Verify that a note containing a `chronos` block displays correctly in Obsidian (via the Chronos plugin) and matches the compiled live-site webpage.

---

## 📋 Progress Log

* **[2026-05-25]**: Issue created based on architectural discussion on integrating vault editor plugins with the Astro static build process.
* **[2026-05-29]**: **Pinned** — Evaluated NPM package `chronos-timeline-md` (vis.js). Formulated decision to build a custom build-time parser from scratch to guarantee zero client-side JS, seamless Swup transitions, and perfect HSL-variable styling. Added [Knight Lab Timeline](https://timeline.knightlab.com/) as design inspiration. Pinned task to prioritize newly spotted vault layout issues first.
