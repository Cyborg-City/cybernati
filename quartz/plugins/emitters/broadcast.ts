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

/**
 * Generates a standalone player.html page.
 *
 * The standalone page contains only the player terminal — no Quartz layout,
 * no sidebar, no header, no footer. It fills the entire browser viewport
 * when viewed directly, and scales to fit any iframe container when embedded.
 */
export function generatePlayerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cybernati Player</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; }
    body { display: flex; align-items: stretch; justify-content: center; min-height: 100vh; }

    .broadcast-terminal {
      margin: 0; padding: 1.5rem; background: #050505;
      border: none; border-radius: 0; box-shadow: none;
      font-family: 'Special Elite', cursive; position: relative;
      display: flex; flex-direction: column;
      width: 100%; height: 100%; box-sizing: border-box;
    }
    .terminal-header { margin-bottom: 1rem; border-bottom: 1px solid #1a1a1a; padding-bottom: 0.8rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .header-brand { display: flex; align-items: center; gap: 0.6rem; }
    .terminal-icon { width: 18px; height: 22px; display: inline-block; vertical-align: middle; }
    .terminal-version { font-size: 1.1rem; color: #fff; text-transform: uppercase; letter-spacing: 0.1rem; line-height: 1; text-decoration: none; }
    .terminal-version:hover { text-shadow: 0 0 8px rgba(0,255,0,0.5); }
    .video-title { color: #0f0; font-size: 1.1rem; font-weight: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1; }

    .terminal-screen { position: relative; width: 100%; flex-grow: 1; min-height: 180px; background: black; overflow: hidden; border: 1px solid #222; }
    .player-mount { width: 100%; height: 100%; }

    .progress-container { position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: #111; z-index: 10; overflow: hidden; }
    .progress-bar { height: 100%; background: #0f0; width: 0%; transition: width 1s linear; box-shadow: 0 0 10px #0f0; }

    .terminal-footer { display: flex; flex-direction: column; margin-top: auto; padding-top: 0.5rem; color: #0f0; font-size: 0.8rem; gap: 0.4rem; position: relative; }
    .footer-top-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .next-section { display: flex; align-items: center; gap: 0.4rem; }
    .top-controls { display: flex; align-items: center; gap: 0.8rem; }
    .footer-fold { width: 100%; text-align: center; background: transparent; border: none; color: #060; cursor: pointer; padding: 0.3rem; font-family: 'IBM Plex Mono', monospace !important; font-size: 0.7rem; border-top: 1px solid #111; border-bottom: 1px solid #111; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .footer-fold:hover { color: #0f0; }
    .footer-collapsible { position: absolute; bottom: 100%; left: 0; width: 100%; background: #050505; z-index: 100; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 300px; opacity: 1; border: 1px solid #111; border-bottom: none; }
    .footer-collapsible.collapsed { max-height: 0; opacity: 0; }
    .footer-collapsible > .footer-section { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-start; padding: 0.5rem 1.5rem 0; margin-top: 0; }
    .footer-collapsible > .footer-row-meta { display: flex; gap: 1.5rem; align-items: center; padding: 0.5rem 1.5rem; margin-top: 0; }
    .footer-section .label { color: #fff; font-weight: bold; text-transform: uppercase; font-size: 0.7rem; font-family: 'IBM Plex Mono', monospace !important; }
    .links-container { display: flex; flex-wrap: wrap; gap: 8px; }
    .vault-link {
      color: #fff; text-decoration: none; border: 1px solid #060; padding: 4px 10px 2px 10px;
      background: rgba(0,255,0,0.05); display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.75rem; transition: all 0.1s ease; line-height: 1;
    }
    .vault-link:hover { background: #0f0; color: #000; }
    .next-title { color: #0c0; font-style: italic; }
    .mute-btn { background: transparent; border: none; color: #060; cursor: pointer; padding: 2px; display: flex; align-items: center; }
    .mute-btn:hover { color: #0f0; }
    .mute-btn.muted { color: #0f0; animation: blink 1s infinite; }

    .desync-action-btn {
      background: #111; border: 1px solid #fff; color: #fff; padding: 6px 16px 4px 16px;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; font-family: inherit; font-size: 0.75rem; border-radius: 4px; line-height: 1;
    }
    .desync-action-btn:hover { background: #0f0; color: #000; }
    .desync-action-btn.active { color: #000; background: #0f0; }

    .terminal-slider { width: 80px; accent-color: #0f0; cursor: pointer; background: transparent; }

    .embed-modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 2rem; }
    .modal-content { background: #050505; border: 1px solid #0f0; padding: 1.5rem; width: 90%; max-width: 500px; color: #0f0; box-shadow: 0 0 40px rgba(0,255,0,0.2); box-sizing: border-box; }
    .modal-header { font-size: 0.7rem; margin-bottom: 0.5rem; border-bottom: 1px solid #040; }
    #embed-code { width: 100%; height: 80px; background: #000; color: #0c0; border: 1px solid #040; font-family: inherit; font-size: 0.6rem; padding: 0.5rem; margin-bottom: 1rem; resize: none; }
    .handshake-btn { background: #111; border: 1px solid #fff; color: #fff; padding: 6px 16px 4px 16px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-family: inherit; font-size: 0.75rem; border-radius: 4px; line-height: 1; text-transform: uppercase; }
    .handshake-btn:hover { background: #0f0; color: #000; }

    .signal-initializing { height: 100%; display: flex; align-items: center; justify-content: center; background: #000; color: #0f0; }
    @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

    /* Responsive: small viewports */
    @media (max-width: 600px) {
      .broadcast-terminal { padding: 0.75rem; }
      .terminal-header { margin-bottom: 0.5rem; padding-bottom: 0.4rem; }
      .terminal-version { font-size: 0.85rem; letter-spacing: 0.05rem; }
      .video-title { font-size: 0.85rem; }
      .terminal-screen { min-height: 180px; }
      .footer-top-row { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
      .top-controls { gap: 0.4rem; width: 100%; justify-content: flex-end; }
      .desync-action-btn { padding: 4px 10px 2px 10px; font-size: 0.65rem; }
      .terminal-slider { width: 60px; }
      .footer-fold { padding: 0.25rem; }
      .footer-collapsible { max-height: 250px; }
      .footer-collapsible > .footer-section,
      .footer-collapsible > .footer-row-meta { padding-left: 0.75rem; padding-right: 0.75rem; }
      .embed-modal { padding: 1rem; }
      .modal-content { padding: 1rem; width: 95%; }
    }
  </style>
</head>
<body>
  <div id="broadcast-root" class="broadcast-terminal">
    <div class="terminal-header">
      <div class="header-brand">
        <img width="18" height="22" class="terminal-icon" alt="" src="static/cybernati.svg" />
        <a class="terminal-version" id="terminal-version">CYBERNATI™ Player Beta |</a>
      </div>
      <div id="video-title" class="video-title">INITIALIZING...</div>
    </div>
    <div id="terminal-screen" class="terminal-screen">
      <div id="player-mount" class="player-mount">
        <div id="terminal-status-msg" class="signal-initializing">SCANNING FOR SIGNAL...</div>
      </div>
      <div id="embed-modal" class="embed-modal">
        <div class="modal-content">
          <div class="modal-header">ESTABLISH_REMOTE_NODE</div>
          <textarea id="embed-code" readonly="readonly"></textarea>
          <div class="modal-footer">
            <button id="copy-embed-btn" class="handshake-btn">COPY_CODE</button>
            <button id="close-embed-btn" class="handshake-btn">CLOSE</button>
          </div>
        </div>
      </div>
      <div id="progress-container" class="progress-container">
        <div id="sync-progress" class="progress-bar"></div>
      </div>
    </div>
    <div class="terminal-footer">
      <div class="footer-top-row">
        <div class="next-section">
          <span class="label">Next:</span>
          <span id="next-title" class="next-title">STANDBY</span>
        </div>
        <div class="top-controls">
          <button id="desync-btn" class="desync-action-btn">DESYNC</button>
          <button id="mute-toggle" class="mute-btn" title="Toggle Mute">
            <svg id="speaker-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          </button>
          <input type="range" id="volume-control" class="terminal-slider" min="0" max="100" value="0" />
          <button id="fullscreen-toggle" class="mute-btn" title="Full Screen">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
        </div>
      </div>
      <button id="footer-fold" class="footer-fold">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
        <span class="fold-text">Show More...</span>
      </button>
      <div id="footer-collapsible" class="footer-collapsible collapsed">
        <div class="footer-section">
          <span class="label">Related Notes:</span>
          <div id="related-links" class="links-container">NONE DETECTED</div>
        </div>
        <div class="footer-row-meta">
          <button id="embed-trigger" class="desync-action-btn">[EMBED_SIGNAL]</button>
        </div>
      </div>
    </div>
  </div>
  <script>
    (function() {
      if (window.CyberPlayer) { window.CyberPlayer.destroy(); }

      window.CyberPlayer = {
        player: null, currentVolume: 0, isMuted: true, handshakeEstablished: false,
        isDesynced: false, updateTimer: null, desyncTimer: null,
        currentVideoId: null, playlistData: null, basePath: null,

        icons: {
          mute: '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>',
          vol: '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>'
        },

        destroy: function() {
          if (this.updateTimer) clearInterval(this.updateTimer);
          if (this.desyncTimer) clearInterval(this.desyncTimer);
          if (this.player && this.player.destroy) this.player.destroy();
          this.player = null; this.currentVideoId = null;
          const mount = document.getElementById('player-mount');
          if (mount) mount.innerHTML = '';
        },

        init: async function() {
          const mount = document.getElementById('player-mount');
          if (!mount || !window.YT || !window.YT.Player) return;
          if (this.isInitializing) return;
          this.isInitializing = true;
          try {
            const pathSegments = window.location.pathname.split('/');
            this.basePath = pathSegments.length > 2 ? '/' + pathSegments[1] + '/' : '/';
            const response = await fetch(this.basePath + 'static/video_playlist.json?v=' + Date.now());
            if (!response.ok) throw new Error("Playlist 404");
            this.playlistData = await response.json();
            this.setupUI(); this.startLoop();
          } catch (e) {
            const status = document.getElementById('terminal-status-msg');
            if (status) status.innerHTML = "CONNECTION ERROR: ARCHIVE UNREACHABLE";
            console.error("Player Error:", e);
          } finally { this.isInitializing = false; }
        },

        setupUI: function() {
          const self = this;
          const icon = document.querySelector('.terminal-icon');
          if (icon) icon.src = self.basePath + 'static/cybernati.svg';

          const versionLink = document.getElementById('terminal-version');
          if (versionLink) versionLink.href = self.basePath;

          const handleInteraction = () => {
            if (self.handshakeEstablished) return;
            self.handshakeEstablished = true; self.isMuted = false; self.currentVolume = 25;
            if (self.player && self.player.unMute) { self.player.unMute(); self.player.setVolume(self.currentVolume); }
            const speaker = document.getElementById('speaker-icon');
            if (speaker) speaker.innerHTML = self.icons.vol;
            const slider = document.getElementById('volume-control');
            if (slider) slider.value = 25;
            const muteBtn = document.getElementById('mute-toggle');
            if (muteBtn) muteBtn.classList.remove('muted');
          };
          window.addEventListener('click', handleInteraction, { once: true });

          const muteBtn = document.getElementById('mute-toggle');
          if (muteBtn) {
            muteBtn.classList.toggle('muted', self.isMuted);
            muteBtn.onclick = () => {
              self.isMuted = !self.isMuted;
              if (self.player) {
                if (self.isMuted) self.player.mute();
                else { if (self.currentVolume === 0) self.currentVolume = 50; self.player.unMute(); self.player.setVolume(self.currentVolume); }
              }
              const speaker = document.getElementById('speaker-icon');
              if (speaker) speaker.innerHTML = self.isMuted ? self.icons.mute : self.icons.vol;
              const slider = document.getElementById('volume-control');
              if (slider) slider.value = self.isMuted ? 0 : self.currentVolume;
              if (muteBtn) muteBtn.classList.toggle('muted', self.isMuted);
            };
          }

          const volSlider = document.getElementById('volume-control');
          if (volSlider) volSlider.oninput = (e) => {
            self.currentVolume = e.target.value;
            self.isMuted = self.currentVolume == 0;
            if (self.player && self.player.setVolume) {
              if (self.isMuted) self.player.mute();
              else { self.player.unMute(); self.player.setVolume(self.currentVolume); }
            }
            const speaker = document.getElementById('speaker-icon');
            if (speaker) speaker.innerHTML = self.isMuted ? self.icons.mute : self.icons.vol;
            if (muteBtn) muteBtn.classList.toggle('muted', self.isMuted);
          };

          const fsBtn = document.getElementById('fullscreen-toggle');
          if (fsBtn) fsBtn.onclick = () => {
            const root = document.getElementById('broadcast-root');
            if (!document.fullscreenElement) root.requestFullscreen();
            else document.exitFullscreen();
          };

          const foldBtn = document.getElementById('footer-fold');
          const collapsible = document.getElementById('footer-collapsible');
          if (foldBtn && collapsible) {
            foldBtn.onclick = () => {
              collapsible.classList.toggle('collapsed');
              const isCollapsed = collapsible.classList.contains('collapsed');
              const arrow = foldBtn.querySelector('svg');
              const text = foldBtn.querySelector('.fold-text');
              if (arrow) {
                arrow.innerHTML = isCollapsed
                  ? '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>'
                  : '<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>';
              }
              if (text) {
                text.textContent = isCollapsed ? 'Show More...' : 'Show Less';
              }
            };
          }

          const desyncBtn = document.getElementById('desync-btn');
          if (desyncBtn) desyncBtn.onclick = () => {
            self.isDesynced = !self.isDesynced;
            if (self.isDesynced) {
              desyncBtn.classList.add('active'); desyncBtn.innerHTML = 'SYNC';
              if (self.updateTimer) clearInterval(self.updateTimer);
              if (self.player && self.player.getPlayerState) { self.player.destroy(); self.player = null; self.currentVideoId = null; }
              self.startDesyncSequence();
            } else {
              desyncBtn.classList.remove('active'); desyncBtn.innerHTML = 'DESYNC';
              if (self.desyncTimer) clearInterval(self.desyncTimer);
              self.currentVideoId = null; self.player = null;
              self.startLoop();
            }
          };

          const embedBtn = document.getElementById('embed-trigger');
          if (embedBtn) embedBtn.onclick = () => {
            const playerUrl = window.location.origin + self.basePath + 'player.html';
            const embedCode = '<iframe src="' + playerUrl + '" width="100%" height="500" frameborder="0" allowfullscreen style="border:none;"></iframe>';
            document.getElementById('embed-code').value = embedCode;
            document.getElementById('embed-modal').style.display = 'flex';
          };
          const copyEmbedBtn = document.getElementById('copy-embed-btn');
          if (copyEmbedBtn) copyEmbedBtn.onclick = () => {
            const textarea = document.getElementById('embed-code');
            if (textarea && textarea.value) {
              if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(textarea.value);
              else { textarea.select(); document.execCommand('copy'); }
            }
          };
          const closeEmbed = document.getElementById('close-embed-btn');
          if (closeEmbed) closeEmbed.onclick = () => { document.getElementById('embed-modal').style.display = 'none'; };
        },

        startLoop: function() {
          const { totalLoopDuration, schedule, interstitials } = this.playlistData;
          const self = this;
          const update = () => {
            if (self.isDesynced) return;
            const now = Math.floor(Date.now() / 1000);
            const pos = now % totalLoopDuration;
            let active = null, standby = true, wait = 0, off = 0, nextIdx = 0;
            for (let i = 0; i < schedule.length; i++) {
              const p = schedule[i];
              if (pos >= p.start && pos < p.end) { active = p; standby = false; off = pos - p.start; nextIdx = (i + 1) % schedule.length; break; }
              if (pos >= p.end && (i === schedule.length - 1 || pos < schedule[i+1].start)) {
                standby = true; wait = (i === schedule.length - 1) ? (totalLoopDuration - pos) : (schedule[i+1].start - pos);
                nextIdx = (i + 1) % schedule.length; break;
              }
            }
            const progressBar = document.getElementById('sync-progress');
            const titleEl = document.getElementById('video-title');
            const nextEl = document.getElementById('next-title');
            if (!standby && active) {
              if (progressBar) progressBar.style.width = (100 - (off / active.duration) * 100) + "%";
              if (titleEl) titleEl.innerHTML = active.title.toUpperCase();
              if (nextEl) nextEl.innerHTML = schedule[nextIdx].title.toUpperCase();
              if (self.currentVideoId !== active.id) self.mountVideo(active, off);
              else if (self.player && self.player.getCurrentTime) {
                const drift = Math.abs(self.player.getCurrentTime() - off);
                if (drift > 3) self.player.seekTo(off, true);
              }
            } else {
              if (progressBar) progressBar.style.width = Math.min(100, (wait / 30) * 100) + "%";
              if (titleEl) titleEl.innerHTML = "SIGNAL_LOST: RE-ALIGNING...";
              if (nextEl) nextEl.innerHTML = schedule[nextIdx].title.toUpperCase();
              self.mountStandby(interstitials);
            }
          };
          if (this.updateTimer) clearInterval(this.updateTimer);
          this.updateTimer = setInterval(update, 1000);
          update();
        },

        startDesyncSequence: function() {
          const { schedule, interstitials } = this.playlistData;
          const self = this;
          if (this.updateTimer) clearInterval(this.updateTimer);
          const playRandom = () => {
            const prog = self.findRandomVideo(schedule);
            if (!prog) return;
            const playWindow = Math.min(prog.duration, 300);
            const startAt = Math.floor(Math.random() * (prog.duration - playWindow));
            self.mountVideo(prog, startAt);
            let remaining = playWindow;
            if (self.desyncTimer) clearInterval(self.desyncTimer);
            self.desyncTimer = setInterval(() => {
              if (!self.isDesynced) { clearInterval(self.desyncTimer); return; }
              remaining--;
              const progressBar = document.getElementById('sync-progress');
              if (progressBar) progressBar.style.width = (remaining / playWindow * 100) + "%";
              if (remaining <= 0) { clearInterval(self.desyncTimer); self.mountStandby(interstitials); setTimeout(playRandom, 5000); }
            }, 1000);
          };
          playRandom();
        },

        mountVideo: function(prog, offset) {
          const mount = document.getElementById('player-mount');
          if (!mount) return;
          if (this.currentVideoId === prog.id && this.player && this.player.getPlayerState && this.player.getPlayerState() > 0) return;
          if (this.player && this.player.destroy) { this.player.destroy(); }
          this.player = null; this.currentVideoId = prog.id;
          mount.innerHTML = '<div id="yt-player"></div>';
          const self = this;
          this.player = new YT.Player('yt-player', {
            height: '100%', width: '100%', videoId: prog.id,
            playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, start: Math.floor(offset) },
            events: {
              onReady: (e) => { if (self.isMuted) { e.target.mute(); } else { e.target.unMute(); e.target.setVolume(self.currentVolume); } },
              onError: (e) => { console.error('YT Player Error:', e); }
            }
          });
          const linksEl = document.getElementById('related-links');
          if (linksEl) linksEl.innerHTML = (prog.related?.length > 0)
            ? prog.related.map(l => '<a href="' + this.basePath + l.slug + '" target="_blank" class="vault-link">' + l.name + '</a>').join(' ')
            : "NONE DETECTED";
        },

        mountStandby: function(interstitials) {
          const mount = document.getElementById('player-mount');
          if (!mount) return;
          const intFile = this.basePath + interstitials[Math.floor(Date.now() / 10000) % interstitials.length].replace(/^\\//, '');
          const existing = mount.querySelector('video');
          if (existing && existing.getAttribute('src') === intFile) return;
          if (this.player && this.player.destroy) { this.player.destroy(); this.player = null; this.currentVideoId = null; }
          mount.innerHTML = '<video src="' + intFile + '" autoplay muted loop style="width:100%; height:100%; background:black; object-fit: cover;"></video>';
        },

        findRandomVideo: function(timeline) {
          if (timeline.length === 0) return null;
          return timeline[Math.floor(Math.random() * timeline.length)];
        }
      };

      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const checkReady = setInterval(() => {
        if (window.YT && window.YT.Player && document.getElementById('player-mount')) {
          clearInterval(checkReady); window.CyberPlayer.init();
        }
      }, 500);
    })();
  </script>
</body>
</html>`
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

      // Emit playlist JSON
      const fp = joinSegments("static", "video_playlist") as FullSlug

      yield write({
        ctx,
        content: JSON.stringify(playlist, null, 2),
        slug: fp,
        ext: ".json",
      })

      // Emit standalone player page (embeddable, no Quartz layout)
      const playerHtml = generatePlayerHtml()
      yield write({
        ctx,
        content: playerHtml,
        slug: "player" as FullSlug,
        ext: ".html",
      })

      console.log("=".repeat(50))
      console.log(`📡 TIMELINE SYNCED: ${totalLoopDuration}s total loop`)
      console.log(`📁 Output: static/video_playlist.json`)
      console.log(`📁 Output: player.html`)
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