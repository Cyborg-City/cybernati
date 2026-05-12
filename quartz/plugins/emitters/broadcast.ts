/**
 * @fileoverview Cybernati Broadcast Emitter — Modular Implementation
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE OVERVIEW
 * ════════════════════════════════════════════════════════════════════════════
 * This module implements the four core components of the Broadcast Emitter,
 * following SOLID/DRY principles and TDD methodology.
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
 * DESIGN PRINCIPLES
 * ════════════════════════════════════════════════════════════════════════════
 *
 * SOLID Compliance:
 *   - Single Responsibility: Each class has one job
 *   - Open/Closed: Providers are extensible for new source types
 *   - Liskov Substitution: Interface-based design for providers
 *   - Interface Segregation: Small, focused interfaces
 *   - Dependency Inversion: High-level modules don't depend on low-level
 *
 * DRY Compliance:
 *   - Pure timeline math in TimelineEngine (no duplication)
 *   - Centralized schedule configuration in BaseParser
 *   - Shared link resolution logic in LinkResolver
 *
 * BEYONCÉ Principle:
 *   - YouTubeProvider wraps all external source access
 *   - We own the signal, the controls, and the decay layer
 *   - Caching prevents redundant external calls
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

import https from "https"
import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import { BuildCtx } from "../../util/ctx"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { FullSlug, joinSegments } from "../../util/path"
import { ProcessedContent } from "../vfile"

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Filter rule as parsed from channel-0000.base
 * Represents either a tag requirement or folder requirement
 */
export interface FilterRule {
  type: "tag" | "folder"
  value: string
}

/**
 * Sort rule as parsed from channel-0000.base
 * Determines the ordering of videos in the broadcast
 */
export interface SortRule {
  property: "modified" | "created" | "file.name" | string
  direction: "ASC" | "DESC"
}

/**
 * Parsed broadcast configuration from base YAML
 * Contains all rules needed to filter and sort content
 */
export interface BroadcastConfig {
  filters: FilterRule[]
  sortRules: SortRule[]
}

/**
 * Video entry with all metadata needed for timeline calculation
 * This is the output of YouTubeProvider and input to TimelineEngine
 */
export interface VideoEntry {
  id: string
  title: string
  duration: number
  related: { name: string; slug: string }[]
}

/**
 * Video entry with calculated timeline positions
 * Extended from VideoEntry with absolute time markers
 */
export interface TimelineEntry extends VideoEntry {
  start: number
  end: number
}

/**
 * Final playlist structure emitted to video_playlist.json
 */
export interface Playlist {
  totalLoopDuration: number
  schedule: TimelineEntry[]
  interstitials: string[]
}

// ============================================================================
// MODULE 1: BASE PARSER
// ============================================================================

/**
 * BaseParser — Parses channel-0000.base YAML into structured filter/sort rules
 *
 * ════════════════════════════════════════════════════════════════════════════
 * RESPONSIBILITY (Single Responsibility Principle)
 * ════════════════════════════════════════════════════════════════════════════
 * This class is responsible ONLY for parsing the Obsidian Dataview "base" YAML
 * format and extracting structured rules. It does NOT:
 *   - Filter content
 *   - Sort content
 *   - Make network requests
 *   - Calculate timelines
 *
 * This separation allows the filter/sort rules to be tested in isolation
 * and reused by any other component that needs to interpret base files.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * YAML FORMAT HANDLED
 * ════════════════════════════════════════════════════════════════════════════
 * views:
 *   - type: table
 *     name: Table
 *     filters:
 *       and:
 *         - file.hasTag("clippings")
 *         - file.inFolder("video_archive")
 *     sort:
 *       - property: modified
 *         direction: DESC
 *       - property: file.name
 *         direction: ASC
 *
 * ════════════════════════════════════════════════════════════════════════════
 */
export class BaseParser {
  private yaml: string

  constructor(yaml: string) {
    this.yaml = yaml
  }

  /**
   * Parses the YAML string and extracts broadcast configuration
   *
   * @returns BroadcastConfig with filters and sortRules arrays
   * @throws Error if required 'views' key is missing
   */
  parse(): BroadcastConfig {
    // Handle empty YAML
    if (!this.yaml.trim()) {
      return { filters: [], sortRules: [] }
    }

    // Remove comments for cleaner parsing
    const cleanYaml = this.removeComments(this.yaml)

    // Find views array
    const viewsMatch = cleanYaml.match(/views:\s*\n([\s\S]*?)(?=\n\w|$)/)
    if (!viewsMatch) {
      throw new Error("Missing 'views' array in base configuration")
    }

    const viewsContent = viewsMatch[1]
    const filters: FilterRule[] = []
    const sortRules: SortRule[] = []

    // Extract filter lines (file.hasTag, file.inFolder)
    const tagMatches = viewsContent.matchAll(/file\.hasTag\("([^"]+)"\)/g)
    for (const match of tagMatches) {
      filters.push({ type: "tag", value: match[1] })
    }

    const folderMatches = viewsContent.matchAll(/file\.inFolder\("([^"]+)"\)/g)
    for (const match of folderMatches) {
      filters.push({ type: "folder", value: match[1] })
    }

    // Extract sort rules
    const sortSectionMatch = viewsContent.match(/sort:\s*\n([\s\S]*?)(?=\n\w|$)/)
    if (sortSectionMatch) {
      const sortContent = sortSectionMatch[1]
      const propMatches = sortContent.matchAll(/^\s*-\s*property:\s*(\S+)\s*\n\s*direction:\s*(\S+)/gm)
      for (const match of propMatches) {
        sortRules.push({
          property: match[1] as SortRule["property"],
          direction: match[2] as SortRule["direction"],
        })
      }
    }

    return { filters, sortRules }
  }

  /**
   * Removes comments from YAML content
   */
  private removeComments(yaml: string): string {
    return yaml
      .split("\n")
      .map((line) => {
        const commentIndex = line.indexOf("#")
        return commentIndex >= 0 ? line.substring(0, commentIndex) : line
      })
      .join("\n")
  }
}

// ============================================================================
// MODULE 2: YOUTUBE PROVIDER
// ============================================================================

/**
 * YouTubeProvider — Ownership of the YouTube Signal (BEYONCÉ Principle)
 *
 * ════════════════════════════════════════════════════════════════════════════
 * RESPONSIBILITY (Single Responsibility + Open/Closed)
 * ════════════════════════════════════════════════════════════════════════════
 * This class is responsible for ALL YouTube integration:
 *   - ID extraction from various URL formats
 *   - Duration fetching with caching
 *   - VideoEntry creation from frontmatter
 *
 * It's designed to be extensible — future implementations could include:
 *   - DirectProvider (for DVIDS, archive.org, etc.)
 *   - SocialProvider (for Twitter/X, TikTok embeds)
 *   - CustomProvider (for self-hosted content)
 *
 * ════════════════════════════════════════════════════════════════════════════
 * BEYONCÉ PRINCIPLE
 * ════════════════════════════════════════════════════════════════════════════
 * We wrap YouTube in our own terminal logic. This means:
 *   - All network requests go through this class
 *   - Caching prevents redundant calls
 *   - Error handling is centralized
 *   - No external dependencies leak into other modules
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Default fallback duration when scraping fails
 * 300 seconds = 5 minutes (conservative estimate)
 */
const DEFAULT_DURATION = 300

/**
 * Interface for source providers (extensible design)
 */
export interface SourceProvider {
  extractId(url: string): string | null
  getDuration(videoId: string): Promise<number>
  createVideoEntry(frontmatter: Record<string, unknown>): VideoEntry | null
}

export class YouTubeProvider implements SourceProvider {
  private cache: Map<string, number> = new Map()

  /**
   * Extracts YouTube video ID from various URL formats
   */
  extractId(url: string | undefined | null): string | null {
    if (!url) return null

    const match = url.match(
      /(?:v=|\/embed\/|youtu\.be\/|shorts\/|watch\?v=|embed\/|\/v\/)([^&\s]+)/
    )

    return match ? match[1] : null
  }

  /**
   * Fetches video duration from YouTube page (approxDurationMs)
   */
  async fetchDuration(videoId: string): Promise<number> {
    return new Promise((resolve) => {
      https
        .get(`https://www.youtube.com/watch?v=${videoId}`, (res) => {
          let data = ""
          res.on("data", (chunk) => (data += chunk))
          res.on("end", () => {
            const match = data.match(/"approxDurationMs":"(\\d+)"/)
            if (match) {
              resolve(Math.floor(parseInt(match[1]) / 1000))
            } else {
              resolve(DEFAULT_DURATION)
            }
          })
        })
        .on("error", () => resolve(DEFAULT_DURATION))
    })
  }

  /**
   * Gets duration with caching
   */
  async getDuration(videoId: string): Promise<number> {
    const cached = this.cache.get(videoId)
    if (cached !== undefined) {
      return cached
    }

    const duration = await this.fetchDuration(videoId)
    this.cache.set(videoId, duration)
    return duration
  }

  /**
   * Gets cached duration without making network request
   */
  getCachedDuration(videoId: string): number | undefined {
    return this.cache.get(videoId)
  }

  /**
   * Sets cache manually (for testing or pre-population)
   */
  setCache(videoId: string, duration: number): void {
    this.cache.set(videoId, duration)
  }

  /**
   * Creates a VideoEntry from frontmatter data
   */
  createVideoEntry(frontmatter: Record<string, unknown>): VideoEntry | null {
    const source = frontmatter["source"] as string | undefined
    const id = this.extractId(source)

    if (!id) return null

    return {
      id,
      title: (frontmatter["title"] as string) ?? "Untitled",
      duration: (frontmatter["duration"] as number) ?? DEFAULT_DURATION,
      related: this.parseRelatedLinks(frontmatter["related"]),
    }
  }

  /**
   * Parses related links from frontmatter
   */
  private parseRelatedLinks(
    related: string | string[] | undefined,
  ): { name: string; slug: string }[] {
    if (!related) return []

    const links = typeof related === "string" ? related.split(",") : related

    return links.map((link) => {
      const clean = link.replace(/[\[\]]/g, "").split("|")[0].trim()
      return {
        name: clean,
        slug: clean.replace(/\s+/g, "-").toLowerCase(),
      }
    })
  }
}

// ============================================================================
// MODULE 3: TIMELINE ENGINE
// ============================================================================

/**
 * TimelineEngine — Pure Logic for Timeline Calculation (DRY Principle)
 *
 * ════════════════════════════════════════════════════════════════════════════
 * RESPONSIBILITY (Single Responsibility + Pure Functions)
 * ════════════════════════════════════════════════════════════════════════════
 * This class is responsible ONLY for timeline mathematics:
 *   - Calculating absolute start/end times for each video
 *   - Computing total loop duration
 *   - Finding which video plays at a given position
 *
 * It contains NO network requests, file I/O, or side effects.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * TIMELINE RULES
 * ════════════════════════════════════════════════════════════════════════════
 * 1. VARIABLE PLAYBACK: Each video plays in full (duration varies)
 * 2. STAND-BY PROTOCOL: 30 seconds after each video
 * 3. NO TRAILING GAP: Loop restarts after last video
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

const INTERSTITIAL_GAP = 30

export class TimelineEngine {
  /**
   * Calculates timeline positions for a list of videos
   */
  calculateTimeline(videos: VideoEntry[]): TimelineEntry[] {
    const timeline: TimelineEntry[] = []
    let currentTime = 0

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      const entry: TimelineEntry = {
        ...video,
        start: currentTime,
        end: currentTime + video.duration,
      }

      timeline.push(entry)

      // Add gap after video, except for last video
      if (i < videos.length - 1) {
        currentTime = entry.end + INTERSTITIAL_GAP
      }
    }

    return timeline
  }

  /**
   * Calculates the total loop duration
   */
  getTotalLoopDuration(timeline: TimelineEntry[]): number {
    if (timeline.length === 0) return 0
    return timeline[timeline.length - 1].end
  }

  /**
   * Finds the video that should be playing at a given position
   */
  findVideoAtPosition(position: number, timeline: TimelineEntry[]): TimelineEntry | null {
    if (timeline.length === 0) return null

    for (const entry of timeline) {
      if (position >= entry.start && position < entry.end) {
        return entry
      }
    }

    return null
  }

  /**
   * Wraps a position to the loop duration (Unix Epoch modulo sync)
   */
  wrapPosition(position: number, timeline: TimelineEntry[]): number {
    const totalDuration = this.getTotalLoopDuration(timeline)
    if (totalDuration === 0) return 0
    return position % totalDuration
  }

  /**
   * Picks a random video from the timeline for Desync mode
   */
  findRandomVideo(timeline: TimelineEntry[]): TimelineEntry | null {
    if (timeline.length === 0) return null
    const randomIndex = Math.floor(Math.random() * timeline.length)
    return timeline[randomIndex]
  }

  /**
   * Calculates a safe random offset for a video
   * Ensures we don't start at the very end of a long video
   */
  getRandomOffset(duration: number): number {
    if (duration <= 0) return 0
    // Limit play window to 5 mins if video is longer
    const playWindow = Math.min(duration, 300)
    const maxStart = duration - playWindow
    return Math.floor(Math.random() * maxStart)
  }
}

// ============================================================================
// MODULE 4: LINK RESOLVER
// ============================================================================

/**
 * LinkResolver — Maps Wikilinks to Quartz Slugs via BuildCtx
 */
import type { FullSlug } from "../../util/path"

export class LinkResolver {
  private slugMap: Map<string, FullSlug>
  private allSlugs: string[]
  private titleMap: Map<string, string>

  constructor(ctx: BuildCtx, titleMap?: Map<string, string>) {
    this.allSlugs = ctx.allSlugs ?? []
    this.titleMap = titleMap ?? new Map()

    this.slugMap = new Map()
    for (const slug of this.allSlugs) {
      const filename = slug.split("/").pop() ?? slug
      this.slugMap.set(filename.toLowerCase(), slug as FullSlug)
    }
  }

  resolve(link: string): string | null {
    const parsed = this.parseLink(link)
    if (!parsed) return null

    const slugifiedTarget = this.slugify(parsed.target)

    // Check for exact match in our slug map (which stores full slugs)
    const exactMatch = this.slugMap.get(slugifiedTarget)
    if (exactMatch) {
      return exactMatch // Return the FULL slug, not just the filename
    }

    const originalMatch = this.slugMap.get(parsed.target.toLowerCase())
    if (originalMatch) {
      return originalMatch
    }

    // Partial matches
    for (const [slugKey, slugValue] of this.slugMap) {
      if (slugKey.includes(slugifiedTarget)) {
        return slugValue
      }
    }

    return null
  }

  resolveWithAlias(link: string): { name: string; slug: string } | null {
    const parsed = this.parseLink(link)
    if (!parsed) return null

    const slug = this.resolve(`[[${parsed.target}]]`)

    if (slug) {
      // Priority: explicit alias > friendly title from content > raw target name
      const name = parsed.alias ?? this.titleMap.get(slug) ?? parsed.target
      return { name, slug }
    }

    return null
  }

  resolveBatch(links: string[]): { name: string; slug: string }[] {
    const results: { name: string; slug: string }[] = []

    for (const link of links) {
      const resolved = this.resolveWithAlias(link)
      if (resolved) {
        results.push(resolved)
      }
    }

    return results
  }

  slugify(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[\s\-]+/g, "-")
      .replace(/[^\w\-]/g, "")
      .replace(/^-+|-+$/g, "")
  }

  private parseLink(link: string): { target: string; alias?: string } | null {
    const cleaned = link.replace(/[\[\]]/g, "").trim()
    if (!cleaned) return null

    const parts = cleaned.split("|")
    return {
      target: parts[0].trim(),
      alias: parts.length > 1 ? parts[1].trim() : undefined,
    }
  }

  private extractFilename(slug: string): string {
    return slug.split("/").pop() ?? slug
  }
}

// ============================================================================
// BROADCAST EMITTER PLUGIN
// ============================================================================

interface BroadcastEmitterOptions {
  baseFile: string
}

const DEFAULT_OPTIONS: BroadcastEmitterOptions = {
  baseFile: "video_archive/channel-0000.base",
}

export const Broadcast: QuartzEmitterPlugin<Partial<BroadcastEmitterOptions>> = (
  opts,
) => {
  const options = { ...DEFAULT_OPTIONS, ...opts }

  return {
    name: "Broadcast",

    async *emit(ctx, content) {
      console.log("📡 CYBERNATI™ BROADCAST EMITTER - Modular Build")
      console.log("=".repeat(50))

      // NOTE: video_archive is outside the content/ folder, so we read directly
      // from disk. The content parameter contains only content/ files.

      const videoArchiveDir = path.join(process.cwd(), "video_archive")

      // Get all markdown files from video_archive
      let videoFiles: string[] = []
      try {
        videoFiles = fs.readdirSync(videoArchiveDir).filter(f => f.endsWith(".md"))
      } catch {
        console.log(`⚠️  Could not read video_archive directory`)
        yield write({
          ctx,
          content: JSON.stringify({ totalLoopDuration: 0, schedule: [], interstitials: [] }, null, 2),
          slug: joinSegments("static", "video_playlist") as FullSlug,
          ext: ".json",
        })
        return
      }

      console.log(`📋 Found ${videoFiles.length} video files in video_archive/`)

      // Build slug → title map from Quartz content (for friendly related link names)
      const titleMap = new Map<string, string>()
      for (const [, vfile] of content) {
        const data = vfile.data as { slug?: string; frontmatter?: Record<string, unknown> }
        const slug = data.slug
        const title = data.frontmatter?.title as string | undefined
        if (slug && title) {
          titleMap.set(slug, title)
        }
      }

      // Parse frontmatter from each video file
      const provider = new YouTubeProvider()
      const linkResolver = new LinkResolver(ctx, titleMap)
      const videos: VideoEntry[] = []

      for (const filename of videoFiles) {
        const filePath = path.join(videoArchiveDir, filename)
        const fileContent = fs.readFileSync(filePath, "utf-8")

        // Extract frontmatter using regex (same as Quartz)
        const fmMatch = fileContent.match(/^---\n([\s\S]*?)\n---/)
        if (!fmMatch) continue

        // Parse with js-yaml (same as Quartz's FrontMatter transformer)
        let fm: Record<string, unknown>
        try {
          fm = yaml.load(fmMatch[1], { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>
        } catch {
          console.log(`  ⚠️  Failed to parse "${filename}"`)
          continue
        }

        // Check if file has "clippings" tag
        const tags = Array.isArray(fm["tags"]) ? fm["tags"] as string[] : []
        if (!tags.includes("clippings")) {
          continue
        }

        const entry = provider.createVideoEntry(fm)
        if (!entry) {
          console.log(`  ⚠️  Skipping "${fm["title"] || filename}" - Invalid source`)
          continue
        }

        // Resolve related links if any
        if (entry.related.length > 0) {
          entry.related = linkResolver.resolveBatch(entry.related.map(r => r.name))
        }

        // Fetch duration if missing or default
        if (entry.duration === DEFAULT_DURATION || entry.duration === 0) {
          process.stdout.write(`  ⏳ Fetching ${entry.id}... `)
          entry.duration = await provider.getDuration(entry.id)
          console.log(`${entry.duration}s`)
        }

        // Store filename for sorting
        (entry as any)._filePath = filename

        videos.push(entry)
        console.log(`  ✓ ${entry.title.substring(0, 50)}... (${entry.duration}s)`)
      }

      // Sort by modified DESC then name ASC
      // Uses fs.statSync to get actual file modification times
      videos.sort((a, b) => {
        // Get file paths (stored during parsing)
        const aPath = (a as any)._filePath as string | undefined
        const bPath = (b as any)._filePath as string | undefined

        if (!aPath || !bPath) {
          // Fallback to title sort
          return a.title.localeCompare(b.title)
        }

        try {
          const aStat = fs.statSync(path.join(videoArchiveDir, aPath))
          const bStat = fs.statSync(path.join(videoArchiveDir, bPath))

          // Sort by modified DESC (newer first)
          const mtimeDiff = bStat.mtimeMs - aStat.mtimeMs
          if (mtimeDiff !== 0) return mtimeDiff

          // If same time, sort by name ASC (alphabetical)
          return a.title.localeCompare(b.title)
        } catch {
          return a.title.localeCompare(b.title)
        }
      })

      console.log(`📋 Processed ${videos.length} video entries`)

      // Calculate timeline
      const engine = new TimelineEngine()
      const timeline = engine.calculateTimeline(videos)
      const totalLoopDuration = engine.getTotalLoopDuration(timeline)

      // Build playlist
      const playlist: Playlist = {
        totalLoopDuration,
        schedule: timeline,
        interstitials: [
          "/static/interstitials/int-01.mp4",
          "/static/interstitials/int-02.mp4",
          "/static/interstitials/int-03.mp4",
        ],
      }

      // Emit file
      const fp = joinSegments("static", "video_playlist") as FullSlug

      yield write({
        ctx,
        content: JSON.stringify(playlist, null, 2),
        slug: fp,
        ext: ".json",
      })

      console.log("=".repeat(50))
      console.log(`📡 TIMELINE SYNCED: ${totalLoopDuration}s total loop`)
      console.log(`📁 Output: static/video_playlist.json`)
      console.log("=".repeat(50))
    },
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type FilterRule,
  type SortRule,
  type BroadcastConfig,
  type VideoEntry,
  type TimelineEntry,
  type Playlist
}