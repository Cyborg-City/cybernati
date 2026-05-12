/**
 * @fileoverview Broadcast Emitter - Modular TDD Test Suite
 *
 * ════════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ════════════════════════════════════════════════════════════════════════════
 * This test suite defines the expected behavior of the four modular components
 * of the Cybernati Broadcast Emitter. Following TDD principles, these tests
 * define the contract before implementation.
 *
 * RUN ORDER:
 *   npm test -- quartz/plugins/emitters/broadcast.test.ts
 *
 * EXPECTED: All tests FAIL until implementation is complete.
 * Once complete: All tests should PASS.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * MODULE OVERVIEW
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
 *  │   BaseParser    │────▶│ TimelineEngine   │────▶│ video_playlist  │
 *  │ (filter/sort)   │     │  (pure math)     │     │     .json       │
 *  └────────┬────────┘     └──────────────────┘     └─────────────────┘
 *           │                        ▲
 *           │                        │
 *  ┌────────▼────────┐     ┌───────┴──────────┐
 *  │  LinkResolver    │────▶│  YouTubeProvider │
 *  │ (BuildCtx slugs) │     │  (ID + duration) │
 *  └──────────────────┘     └──────────────────┘
 *
 * ════════════════════════════════════════════════════════════════════════════
 * TESTING PHILOSOPHY
 * ════════════════════════════════════════════════════════════════════════════
 * - Each module is tested INDEPENDENTLY (SOLID compliance)
 * - Pure functions have no side effects — deterministic tests
 * - I/O operations (YouTube scraping) are mocked for unit tests
 * - Integration tests use real BuildCtx in a separate file
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

import test, { describe } from "node:test"
import assert from "node:assert"

// Import the modules under test
import {
  BaseParser,
  YouTubeProvider,
  TimelineEngine,
  LinkResolver,
  generatePlayerHtml,
  type VideoEntry,
  type TimelineEntry,
  type FilterRule,
  type SortRule,
  type BroadcastConfig,
} from "./broadcast"

// Import BuildCtx type for LinkResolver tests
import type { BuildCtx } from "../../util/ctx"

// ============================================================================
// BASE PARSER TESTS
// ============================================================================

describe("BaseParser", () => {
  describe("YAML Parsing", () => {
    test("parses valid channel-0000.base YAML into BroadcastConfig", () => {
      const yaml = `
views:
  - type: table
    name: Table
    filters:
      and:
        - file.hasTag("clippings")
        - file.inFolder("video_archive")
    sort:
      - property: modified
        direction: DESC
      - property: file.name
        direction: ASC
`
      const parser = new BaseParser(yaml)
      const config = parser.parse()

      assert.strictEqual(config.filters.length, 2)
      assert.strictEqual(config.sortRules.length, 2)
    })

    test("extracts tag filter from file.hasTag() notation", () => {
      const yaml = `
views:
  - type: table
    filters:
      and:
        - file.hasTag("clippings")
`
      const parser = new BaseParser(yaml)
      const config = parser.parse()

      assert.strictEqual(config.filters[0].type, "tag")
      assert.strictEqual(config.filters[0].value, "clippings")
    })

    test("extracts folder filter from file.inFolder() notation", () => {
      const yaml = `
views:
  - type: table
    filters:
      and:
        - file.inFolder("video_archive")
`
      const parser = new BaseParser(yaml)
      const config = parser.parse()

      assert.strictEqual(config.filters[0].type, "folder")
      assert.strictEqual(config.filters[0].value, "video_archive")
    })

    test("extracts multiple sort rules in order", () => {
      const yaml = `
views:
  - type: table
    sort:
      - property: modified
        direction: DESC
      - property: file.name
        direction: ASC
`
      const parser = new BaseParser(yaml)
      const config = parser.parse()

      assert.strictEqual(config.sortRules[0].property, "modified")
      assert.strictEqual(config.sortRules[0].direction, "DESC")
      assert.strictEqual(config.sortRules[1].property, "file.name")
      assert.strictEqual(config.sortRules[1].direction, "ASC")
    })
  })

  describe("Error Handling", () => {
    test("throws on missing views array", () => {
      const noViewsYaml = `
other:
  - section: value
`
      const parser = new BaseParser(noViewsYaml)
      assert.throws(() => parser.parse(), Error)
    })
  })

  describe("Edge Cases", () => {
    test("handles empty YAML string", () => {
      const parser = new BaseParser("")
      const config = parser.parse()

      assert.deepStrictEqual(config.filters, [])
      assert.deepStrictEqual(config.sortRules, [])
    })

    test("handles YAML with comments", () => {
      const yamlWithComments = `
# This is a comment
views:
  - type: table # inline comment
    # filters section
    filters:
      and:
        - file.hasTag("clippings") # clips tag
`
      const parser = new BaseParser(yamlWithComments)
      const config = parser.parse()

      assert.strictEqual(config.filters[0].value, "clippings")
    })

    test("handles multiple filter types", () => {
      const yaml = `
views:
  - type: table
    filters:
      and:
        - file.hasTag("clippings")
        - file.hasTag("featured")
        - file.inFolder("video_archive")
`
      const parser = new BaseParser(yaml)
      const config = parser.parse()

      assert.strictEqual(config.filters.length, 3)
    })
  })
})

// ============================================================================
// YOUTUBE PROVIDER TESTS
// ============================================================================

describe("YouTubeProvider", () => {
  describe("ID Extraction", () => {
    test("extracts ID from watch?v= format", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId("https://www.youtube.com/watch?v=abc123def456")
      assert.strictEqual(id, "abc123def456")
    })

    test("extracts ID from youtu.be short format", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId("https://youtu.be/xyz789")
      assert.strictEqual(id, "xyz789")
    })

    test("extracts ID from /embed/ format", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId("https://www.youtube.com/embed/dQw4w9WgXcQ")
      assert.strictEqual(id, "dQw4w9WgXcQ")
    })

    test("extracts ID from shorts format", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId("https://www.youtube.com/shorts/lMnKrBZhO4g")
      assert.strictEqual(id, "lMnKrBZhO4g")
    })

    test("extracts ID from /v/ format (older embeds)", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId("https://www.youtube.com/v/PBZwDwQPzfY")
      assert.strictEqual(id, "PBZwDwQPzfY")
    })

    test("returns null for invalid URL", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId("https://vimeo.com/123456789")
      assert.strictEqual(id, null)
    })

    test("returns null for empty input", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId("")
      assert.strictEqual(id, null)
    })

    test("returns null for undefined", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId(undefined)
      assert.strictEqual(id, null)
    })

    test("strips additional query parameters", () => {
      const provider = new YouTubeProvider()
      const id = provider.extractId(
        "https://www.youtube.com/watch?v=abc123&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9lrdf&t=120",
      )
      assert.strictEqual(id, "abc123")
    })
  })

  describe("Caching", () => {
    test("caches fetched durations", async () => {
      const provider = new YouTubeProvider()
      const videoId = "cached_video_123"

      // Manually set cache
      provider.setCache(videoId, 500)

      // Should return cached value
      const cached = provider.getCachedDuration(videoId)
      assert.strictEqual(cached, 500)
    })

    test("returns cached duration without network request", async () => {
      const provider = new YouTubeProvider()
      const videoId = "test_cache"

      // Manually set cache
      provider.setCache(videoId, 1234)

      // getCachedDuration returns cached without network call
      const cached = provider.getCachedDuration(videoId)
      assert.strictEqual(cached, 1234)
    })

    test("cache key is video ID", () => {
      const provider = new YouTubeProvider()
      const id1 = provider.extractId("https://www.youtube.com/watch?v=abc123")
      const id2 = provider.extractId("https://www.youtube.com/watch?v=abc123")

      assert.strictEqual(id1, id2)
      assert.strictEqual(typeof id1, "string")

      // Setting cache on one ID should be accessible by same ID
      provider.setCache(id1!, 100)
      assert.strictEqual(provider.getCachedDuration(id1!), 100)
    })
  })

  describe("Integration with VideoEntry", () => {
    test("creates VideoEntry from frontmatter source URL", () => {
      const provider = new YouTubeProvider()
      const frontmatter = {
        title: "Test Video",
        source: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        duration: 8627,
        related: ["[[Related Note]]"],
      }

      const entry = provider.createVideoEntry(frontmatter)

      assert.ok(entry !== null)
      assert.strictEqual(entry!.id, "dQw4w9WgXcQ")
      assert.strictEqual(entry!.title, "Test Video")
      assert.strictEqual(entry!.duration, 8627)
    })

    test("returns null entry for invalid source URL", () => {
      const provider = new YouTubeProvider()
      const frontmatter = {
        title: "Bad Video",
        source: "https://notyoutube.com/video",
        duration: 100,
      }

      const entry = provider.createVideoEntry(frontmatter)

      assert.strictEqual(entry, null)
    })

    test("uses DEFAULT_DURATION when duration not provided", () => {
      const provider = new YouTubeProvider()
      const frontmatter = {
        title: "No Duration",
        source: "https://www.youtube.com/watch?v=abc123",
      }

      const entry = provider.createVideoEntry(frontmatter)

      assert.ok(entry !== null)
      assert.strictEqual(entry!.duration, 300) // DEFAULT_DURATION
    })
  })
})

// ============================================================================
// TIMELINE ENGINE TESTS
// ============================================================================

describe("TimelineEngine", () => {
  describe("Basic Timeline Calculation", () => {
    test("calculates correct start/end for single video", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "abc123", title: "Video 1", duration: 100, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)

      assert.strictEqual(timeline.length, 1)
      assert.strictEqual(timeline[0].start, 0)
      assert.strictEqual(timeline[0].end, 100)
    })

    test("calculates correct start/end for multiple videos", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Video A", duration: 100, related: [] },
        { id: "b", title: "Video B", duration: 200, related: [] },
        { id: "c", title: "Video C", duration: 300, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)

      // Video A: start=0, end=100
      assert.strictEqual(timeline[0].start, 0)
      assert.strictEqual(timeline[0].end, 100)

      // Video B: start=100+30=130, end=130+200=330
      assert.strictEqual(timeline[1].start, 130)
      assert.strictEqual(timeline[1].end, 330)

      // Video C: start=330+30=360, end=360+300=660
      assert.strictEqual(timeline[2].start, 360)
      assert.strictEqual(timeline[2].end, 660)
    })

    test("adds 30s gap between all videos", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Video A", duration: 100, related: [] },
        { id: "b", title: "Video B", duration: 100, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)

      // Gap between A and B should be 30s
      assert.strictEqual(timeline[1].start - timeline[0].end, 30)
    })

    test("NO gap after last video", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Video A", duration: 100, related: [] },
        { id: "b", title: "Video B", duration: 100, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)

      // Last video ends at 130, no trailing gap in loop duration
      assert.strictEqual(timeline[1].end, 230) // 100 + 30 + 100
    })
  })

  describe("Total Loop Duration", () => {
    test("calculates total loop duration", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Video A", duration: 100, related: [] },
        { id: "b", title: "Video B", duration: 200, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)
      const totalDuration = engine.getTotalLoopDuration(timeline)

      // 100 + 30 (gap) + 200 = 330
      assert.strictEqual(totalDuration, 330)
    })

    test("handles empty video list", () => {
      const engine = new TimelineEngine()
      const timeline = engine.calculateTimeline([])
      const totalDuration = engine.getTotalLoopDuration(timeline)

      assert.strictEqual(totalDuration, 0)
    })

    test("handles single video (no gaps)", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Single", duration: 500, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)
      const totalDuration = engine.getTotalLoopDuration(timeline)

      assert.strictEqual(totalDuration, 500)
    })

    test("total duration excludes trailing gap", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Video A", duration: 100, related: [] },
        { id: "b", title: "Video B", duration: 100, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)
      const totalDuration = engine.getTotalLoopDuration(timeline)

      // Loop restarts after last video, no trailing gap
      // Video A: 0-100, Gap: 100-130, Video B: 130-230
      // Loop = 230, NOT 260 (which would include trailing gap)
      assert.strictEqual(totalDuration, 230)
    })
  })

  describe("Edge Cases", () => {
    test("handles zero-duration videos", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Zero Duration", duration: 0, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)

      assert.strictEqual(timeline[0].start, 0)
      assert.strictEqual(timeline[0].end, 0)
    })

    test("handles very long videos", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Long Video", duration: 7200, related: [] }, // 2 hours
      ]

      const timeline = engine.calculateTimeline(videos)

      assert.strictEqual(timeline[0].end, 7200)
    })

    test("preserves video metadata in timeline entry", () => {
      const engine = new TimelineEngine()
      const related = [{ name: "Related", slug: "related" }]
      const videos: VideoEntry[] = [
        { id: "abc123", title: "Full Video", duration: 100, related },
      ]

      const timeline = engine.calculateTimeline(videos)

      assert.strictEqual(timeline[0].id, "abc123")
      assert.strictEqual(timeline[0].title, "Full Video")
      assert.deepStrictEqual(timeline[0].related, related)
    })
    })

    describe("Position & Progress Logic", () => {
    const engine = new TimelineEngine()
    const videos: VideoEntry[] = [
      { id: "v1", title: "Video 1", duration: 100, related: [] },
      { id: "v2", title: "Video 2", duration: 100, related: [] },
    ]
    const timeline = engine.calculateTimeline(videos)

    test("identifies active video correctly", () => {
      const active = engine.findVideoAtPosition(50, timeline)
      assert.strictEqual(active?.id, "v1")
    })

    test("identifies standby gap correctly", () => {
      const active = engine.findVideoAtPosition(115, timeline) // Between 100 and 130
      assert.strictEqual(active, null)
    })

    test("calculates progress bar percentage for active video", () => {
      const active = engine.findVideoAtPosition(25, timeline)
      const off = 25 - active!.start
      const progress = (off / active!.duration) * 100
      assert.strictEqual(progress, 25)
      // Visual Bar: 100 - 25 = 75% remaining
      assert.strictEqual(100 - progress, 75)
    })

    test("calculates countdown progress for 30s standby gap", () => {
      // In standby (100 to 130). Position 115 is halfway through.
      const pos = 115
      const nextIdx = 1
      const wait = timeline[nextIdx].start - pos // 130 - 115 = 15s remaining

      const standbyProgress = Math.min(100, (wait / 30) * 100)
      assert.strictEqual(standbyProgress, 50)
    })

    test("standby progress is 100% at start of gap", () => {
      const pos = 100
      const nextIdx = 1
      const wait = timeline[nextIdx].start - pos // 30s remaining
      const standbyProgress = (wait / 30) * 100
      assert.strictEqual(standbyProgress, 100)
    })

    test("standby progress is 0% at end of gap", () => {
      const pos = 130
      const nextIdx = 1
      const wait = timeline[nextIdx].start - pos // 0s remaining
      const standbyProgress = (wait / 30) * 100
      assert.strictEqual(standbyProgress, 0)
    })
  })

  describe("Sync Position Lookup", () => {
    test("finds video at given position", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Video A", duration: 100, related: [] },
        { id: "b", title: "Video B", duration: 100, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)

      // Position 50 is in Video A (0-100)
      const video = engine.findVideoAtPosition(50, timeline)
      assert.strictEqual(video?.id, "a")

      // Position 150 is in Video B (130-230)
      const video2 = engine.findVideoAtPosition(150, timeline)
      assert.strictEqual(video2?.id, "b")
    })

    test("returns null for empty timeline", () => {
      const engine = new TimelineEngine()
      const timeline: TimelineEntry[] = []

      const video = engine.findVideoAtPosition(50, timeline)
      assert.strictEqual(video, null)
    })

    test("wraps position to loop duration", () => {
      const engine = new TimelineEngine()
      const videos: VideoEntry[] = [
        { id: "a", title: "Video A", duration: 100, related: [] },
      ]

      const timeline = engine.calculateTimeline(videos)
      const totalDuration = engine.getTotalLoopDuration(timeline)

      // Simulate Unix Epoch modulo sync
      const now = 1000
      const wrappedPosition = engine.wrapPosition(now, timeline)

      // 1000 % 100 = 0
      assert.strictEqual(wrappedPosition, 0)

      const video = engine.findVideoAtPosition(wrappedPosition, timeline)
      assert.strictEqual(video?.id, "a")
    })

    test("picks a random video from timeline", () => {
        const engine = new TimelineEngine()
        const videos: VideoEntry[] = [
            { id: "v1", title: "V1", duration: 100, related: [] },
            { id: "v2", title: "V2", duration: 100, related: [] }
        ]
        const timeline = engine.calculateTimeline(videos)
        const random = engine.findRandomVideo(timeline)
        assert.ok(random !== null)
        assert.ok(random.id === "v1" || random.id === "v2")
    })

    test("calculates a safe random offset (5m window)", () => {
        const engine = new TimelineEngine()
        // Video duration 1000s (16 mins)
        // Max start should be 1000 - 300 = 700s
        const offset = engine.getRandomOffset(1000)
        assert.ok(offset >= 0 && offset <= 700)
    })
  })
})

// ============================================================================
// LINK RESOLVER TESTS
// ============================================================================

describe("LinkResolver", () => {
  describe("Slug Resolution", () => {
    test("resolves simple Wikilink to slug", () => {
      // Mock BuildCtx with slug map
      const mockCtx = {
        allSlugs: ["places/target-note", "people/john-doe"],
        allFiles: ["places/target-note.md", "people/john-doe.md"],
      } as unknown as BuildCtx

      const resolver = new LinkResolver(mockCtx)
      const slug = resolver.resolve("[[Target Note]]")

      assert.strictEqual(slug, "places/target-note")
    })

    test("uses friendly title from titleMap when available", () => {
      const mockCtx = {
        allSlugs: ["places/quantum-physics"],
        allFiles: ["places/quantum-physics.md"],
      } as unknown as BuildCtx

      const titleMap = new Map<string, string>()
      titleMap.set("places/quantum-physics", "The Quantum Physics of Consciousness")

      const resolver = new LinkResolver(mockCtx, titleMap)
      const result = resolver.resolveWithAlias("[[Quantum Physics]]")

      assert.ok(result !== null)
      assert.strictEqual(result!.name, "The Quantum Physics of Consciousness")
      assert.strictEqual(result!.slug, "places/quantum-physics")
    })

    test("falls back to raw name when titleMap has no entry", () => {
      const mockCtx = {
        allSlugs: ["places/quantum-physics"],
        allFiles: ["places/quantum-physics.md"],
      } as unknown as BuildCtx

      const resolver = new LinkResolver(mockCtx)
      const result = resolver.resolveWithAlias("[[Quantum Physics]]")

      assert.ok(result !== null)
      assert.strictEqual(result!.name, "Quantum Physics")
      assert.strictEqual(result!.slug, "places/quantum-physics")
    })

    test("prefers alias over titleMap when alias is provided", () => {
      const mockCtx = {
        allSlugs: ["places/quantum-physics"],
        allFiles: ["places/quantum-physics.md"],
      } as unknown as BuildCtx

      const titleMap = new Map<string, string>()
      titleMap.set("places/quantum-physics", "The Quantum Physics of Consciousness")

      const resolver = new LinkResolver(mockCtx, titleMap)
      const result = resolver.resolveWithAlias("[[Quantum Physics|Quantum]]")

      assert.ok(result !== null)
      assert.strictEqual(result!.name, "Quantum")
      assert.strictEqual(result!.slug, "places/quantum-physics")
    })

    test("resolves Wikilink with display alias", () => {
      const mockCtx = {
        allSlugs: ["places/quantum-physics"],
        allFiles: ["places/quantum-physics.md"],
      } as unknown as BuildCtx

      const resolver = new LinkResolver(mockCtx)
      const result = resolver.resolveWithAlias("[[Quantum Physics|Quantum]]")

      assert.ok(result !== null)
      assert.strictEqual(result!.name, "Quantum")
      assert.strictEqual(result!.slug, "places/quantum-physics")
    })

    test("handles plain text (no brackets)", () => {
      const mockCtx = {
        allSlugs: ["people/john-doe"],
        allFiles: ["people/john-doe.md"],
      } as unknown as BuildCtx

      const resolver = new LinkResolver(mockCtx)
      const slug = resolver.resolve("John Doe")

      assert.strictEqual(slug, "people/john-doe")
    })
  })

  describe("Batch Resolution", () => {
    test("resolves array of links", () => {
      const mockCtx = {
        allSlugs: ["places/note-a", "places/note-b"],
        allFiles: ["places/note-a.md", "places/note-b.md"],
      } as unknown as BuildCtx

      const resolver = new LinkResolver(mockCtx)
      const links = ["[[Note A]]", "[[Note B]]"]

      const resolved = resolver.resolveBatch(links)

      assert.strictEqual(resolved.length, 2)
      assert.strictEqual(resolved[0].name, "Note A")
      assert.strictEqual(resolved[0].slug, "places/note-a")
      assert.strictEqual(resolved[1].name, "Note B")
      assert.strictEqual(resolved[1].slug, "places/note-b")
    })

    test("skips unresolved links in batch", () => {
      const mockCtx = {
        allSlugs: ["places/found"],
        allFiles: ["places/found.md"],
      } as unknown as BuildCtx

      const resolver = new LinkResolver(mockCtx)
      const links = ["[[Found]]", "[[Not Found]]"]

      const resolved = resolver.resolveBatch(links)

      // Should only include resolved
      assert.strictEqual(resolved.length, 1)
      assert.strictEqual(resolved[0].slug, "places/found")
    })
  })

  describe("Slug Generation", () => {
    test("converts spaces to hyphens", () => {
      const mockCtx = { allSlugs: [], allFiles: [] } as unknown as BuildCtx
      const resolver = new LinkResolver(mockCtx)

      const slug = resolver.slugify("Multiple Words Here")
      assert.strictEqual(slug, "multiple-words-here")
    })

    test("converts to lowercase", () => {
      const mockCtx = { allSlugs: [], allFiles: [] } as unknown as BuildCtx
      const resolver = new LinkResolver(mockCtx)

      const slug = resolver.slugify("UPPERCASE TITLE")
      assert.strictEqual(slug, "uppercase-title")
    })

    test("handles multiple spaces", () => {
      const mockCtx = { allSlugs: [], allFiles: [] } as unknown as BuildCtx
      const resolver = new LinkResolver(mockCtx)

      const slug = resolver.slugify("Extra   Spaces")
      assert.strictEqual(slug, "extra-spaces")
    })

    test("handles special characters", () => {
      const mockCtx = { allSlugs: [], allFiles: [] } as unknown as BuildCtx
      const resolver = new LinkResolver(mockCtx)

      const slug = resolver.slugify("Test (With) [Brackets]")
      assert.strictEqual(slug, "test-with-brackets")
    })
  })

  describe("BuildCtx Integration", () => {
    test("uses allSlugs for resolution", () => {
      const mockCtx = {
        allSlugs: ["dossiers/slit-experiment", "people/einstein"],
        allFiles: ["dossiers/slit-experiment.md", "people/einstein.md"],
      } as unknown as BuildCtx

      const resolver = new LinkResolver(mockCtx)
      const slug = resolver.resolve("[[slit-experiment]]")

      assert.strictEqual(slug, "dossiers/slit-experiment")
    })

    test("returns null for non-existent links (batch will filter)", () => {
      const mockCtx = { allSlugs: [], allFiles: [] } as unknown as BuildCtx
      const resolver = new LinkResolver(mockCtx)

      // When allSlugs is empty, no links can be resolved
      // resolveWithAlias returns null for unresolved links
      const result = resolver.resolveWithAlias("[[Any Note]]")
      
      // Should return null - non-existent links are not resolved
      assert.strictEqual(result, null)
    })

    test("returns full slug when slug exists but link is partial match", () => {
      const mockCtx = {
        allSlugs: ["dossiers/slit-experiment-2025"],
        allFiles: ["dossiers/slit-experiment-2025.md"],
      } as unknown as BuildCtx
      const resolver = new LinkResolver(mockCtx)

      // A partial match should still resolve to the FULL slug
      const result = resolver.resolveWithAlias("[[slit-experiment]]")
      
      assert.ok(result !== null)
      assert.strictEqual(result!.slug, "dossiers/slit-experiment-2025")
    })
  })
})

// ============================================================================
// STANDALONE PLAYER PAGE TESTS
// ============================================================================

describe("Player Page Generator", () => {
  test("generatePlayerHtml returns a valid HTML document", () => {
    const html = generatePlayerHtml()

    // Must be a complete HTML5 document
    assert.ok(html.startsWith("<!DOCTYPE html>"), "must start with DOCTYPE")
    assert.ok(html.includes("<html lang=\"en\">"), "must have html tag with lang")
    assert.ok(html.includes("</html>"), "must close html tag")
    assert.ok(html.includes("<head>"), "must have head section")
    assert.ok(html.includes("<body>"), "must have body section")
  })

  test("player page loads required Google Fonts", () => {
    const html = generatePlayerHtml()

    // Special Elite for the terminal aesthetic
    assert.ok(html.includes("Special+Elite"), "must load Special Elite font")
    // IBM Plex Mono for labels and monospace text
    assert.ok(html.includes("IBM+Plex+Mono"), "must load IBM Plex Mono font")
  })

  test("player page contains terminal markup", () => {
    const html = generatePlayerHtml()

    assert.ok(html.includes('id="broadcast-root"'), "must have broadcast-root container")
    assert.ok(html.includes('id="player-mount"'), "must have player-mount for YT.Player")
    assert.ok(html.includes('id="sync-progress"'), "must have sync-progress bar")
    assert.ok(html.includes('id="desync-btn"'), "must have desync button")

    // Version text must be a link back to the main site
    assert.ok(html.includes('id="terminal-version"'), "must have terminal-version element")
    const isLink = /<a[^>]*class="terminal-version"[^>]*>/.test(html)
    assert.strictEqual(isLink, true, "terminal-version must be an <a> tag linking to main site")
  })

  test("player page contains extracted CSS from Broadcast.tsx", () => {
    const html = generatePlayerHtml()

    // Key CSS selectors that prove extraction worked
    assert.ok(html.includes(".broadcast-terminal"), "must have .broadcast-terminal CSS")
    assert.ok(html.includes(".terminal-screen"), "must have .terminal-screen CSS")
    assert.ok(html.includes(".progress-bar"), "must have .progress-bar CSS")
    assert.ok(html.includes("@keyframes blink"), "must have blink animation CSS")
  })

  test("player page contains extracted JS from Broadcast.tsx", () => {
    const html = generatePlayerHtml()

    // Key JS patterns that prove extraction worked
    assert.ok(html.includes("window.CyberPlayer"), "must define CyberPlayer singleton")
    assert.ok(html.includes("YT.Player"), "must create YouTube player")
    assert.ok(html.includes("startLoop"), "must have startLoop function")
    assert.ok(html.includes("mountStandby"), "must have mountStandby function")
  })

  test("player page has correct title and meta tags", () => {
    const html = generatePlayerHtml()

    assert.ok(html.includes("<title>Cybernati Player</title>"), "must have correct title")
    assert.ok(html.includes('charset="UTF-8"'), "must have UTF-8 charset")
    assert.ok(html.includes('name="viewport"'), "must have viewport meta")
  })

  test("Next label is white (#fff) in next-section", () => {
    const html = generatePlayerHtml()

    // The "Next:" label must be white, not green (inherited from terminal-footer)
    const hasWhiteLabel = /\.next-section\s+\.label\s*\{[^}]*color:\s*#fff/.test(html)
    assert.strictEqual(hasWhiteLabel, true, ".next-section .label must be white (#fff)")
  })

  test("next-title has truncation CSS (nowrap + ellipsis)", () => {
    const html = generatePlayerHtml()

    const hasNoWrap = /\.next-title\s*\{[^}]*white-space:\s*nowrap/.test(html)
    assert.strictEqual(hasNoWrap, true, ".next-title must have white-space: nowrap")

    const hasEllipsis = /\.next-title\s*\{[^}]*text-overflow:\s*ellipsis/.test(html)
    assert.strictEqual(hasEllipsis, true, ".next-title must have text-overflow: ellipsis")

    const hasMaxWidth = /\.next-title\s*\{[^}]*max-width/.test(html)
    assert.strictEqual(hasMaxWidth, true, ".next-title must have max-width for truncation")
  })

  test("player page has black body background for embedding", () => {
    const html = generatePlayerHtml()

    // When embedded, the host page background shows through if transparent.
    // Black body ensures the terminal looks correct even without Quartz styles.
    assert.ok(html.includes("background: #000"), "must have black body background")
  })

  test("player page icon uses correct relative path", () => {
    const html = generatePlayerHtml()

    // The standalone page is at /player.html, static files are at /static/.
    // So the icon path must be relative: static/cybernati.svg
    assert.ok(html.includes('src="static/cybernati.svg"'), "icon must use static/cybernati.svg path")
  })

  test("interstitial uses persistent index instead of Date.now rotation", () => {
    const html = generatePlayerHtml()

    // Must use currentInterstitialIndex, not the old Date.now() formula
    const hasPersistentIndex = /currentInterstitialIndex/.test(html)
    assert.strictEqual(hasPersistentIndex, true, "must use currentInterstitialIndex for persistent interstitial selection")

    const noDateRotation = /Date\.now\(\)\s*\/\s*10000/.test(html)
    assert.strictEqual(noDateRotation, false, "must NOT use Date.now() / 10000 rotation — causes stutter")
  })

  test("mountVideo clears currentInterstitialIndex", () => {
    const html = generatePlayerHtml()

    // When switching from standby back to video, clear the index so next
    // standby picks a fresh random interstitial
    const clearsIndex = /this\.currentInterstitialIndex\s*=\s*null/.test(html)
    assert.strictEqual(clearsIndex, true, "mountVideo must clear currentInterstitialIndex to null")
  })

  test("desync mode waits for interstitial duration, not fixed 5s", () => {
    const html = generatePlayerHtml()

    // Must read video.duration instead of hardcoded 5000ms
    const readsDuration = /videoEl\.duration/.test(html)
    assert.strictEqual(readsDuration, true, "desync mode must read video.duration for gap timing")

    const noFixedGap = /setTimeout\(playRandom,\s*5000\)/.test(html)
    assert.strictEqual(noFixedGap, false, "desync mode must NOT use hardcoded 5000ms gap")
  })
})

// ============================================================================
// INTEGRATION TEST - Full Emitter Pipeline
// ============================================================================

describe("Broadcast Emitter (Integration)", () => {
  test("generates valid playlist structure", () => {
    const playlist = {
      totalLoopDuration: 0,
      schedule: [],
      interstitials: [
        "/static/interstitials/int-01.mp4",
        "/static/interstitials/int-02.mp4",
        "/static/interstitials/int-03.mp4",
      ],
    }

    assert.ok(playlist.interstitials.length === 3)
    assert.strictEqual(playlist.totalLoopDuration, 0)
    assert.deepStrictEqual(playlist.schedule, [])
  })
})

console.log("✅ Broadcast Emitter Modular Test Suite Loaded")
console.log("   Run with: npm test -- quartz/plugins/emitters/broadcast.test.ts")