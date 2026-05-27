# Issue: Integrate Chronos Timeline Markdown Parser into Astro Build

**Date Created**: 2026-05-25  
**Status**: Open  
**Severity**: Medium  
**Assigned To**: Future Developer Agent  

---

## 📝 Objective & Architectural Concept

To maintain a 1:1 layout match between the local Obsidian vault and the published live site, Astro must be configured to parse and render `chronos` codeblocks. Chronos is an Obsidian plugin that allows authors to write structured timelines in plain markdown codeblocks. 

Currently, these blocks render as raw, unformatted code blocks on the Astro live site. This task involves writing or integrating a markdown compilation utility (via a Remark or Rehype plugin in `astro.config.mjs`) to parse the Chronos syntax at build-time and compile it into lightweight, responsive HTML/CSS timelines.

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
   * Output the parsed timeline as structured, responsive HTML (e.g. an unordered list styled with a vertical timeline axis).
   * Ensure all borders, backgrounds, and text colors use Tailwind's global theme variables (`primary-*`, `highlight-*`) so the timeline automatically adapts when the active site theme is changed.
   * Render the layout cleanly without requiring any runtime client-side JavaScript.

---

## 🎯 Implementation Checklist

The developer agent executing this task must complete the following steps:

- [ ] **1. Create Parser Utility**: Develop the string parsing logic in `src/utils/chronos.ts` and add unit tests to verify robust handling of multi-line bullet points.
- [ ] **2. Register Markdown Plugin**: Configure `astro.config.mjs` to intercept `chronos` codeblocks and replace them with the parsed HTML structure during the markdown compilation phase.
- [ ] **3. Style Layout**: Add responsive, clean CSS styles to render the timeline beautifully on both mobile and desktop screen sizes, leveraging global CSS theme variables.
- [ ] **4. Build Validation**: Add a test page with a complex Chronos timeline to verify that `pnpm run build` compiles without errors and matches the expected layout.
- [ ] **5. Obsidian Verification**: Verify that a note containing a `chronos` block displays correctly in Obsidian (via the Chronos plugin) and matches the compiled live-site webpage.

---

## 📋 Progress Log

* **[2026-05-25]**: Issue created based on architectural discussion on integrating vault editor plugins with the Astro static build process.
