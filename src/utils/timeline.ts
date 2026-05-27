/**
 * Cybernati Timeline Engine
 * Production Implementation
 */

export interface VideoEntry {
  id: string;
  title: string;
  duration: number;
  related: { name: string; slug: string }[];
}

export interface TimelineEntry extends VideoEntry {
  start: number;
  end: number;
}

export interface Playlist {
  totalLoopDuration: number;
  schedule: TimelineEntry[];
  interstitials: string[];
}

// 30 seconds standby interstitial gap after each video (except the last one)
export const INTERSTITIAL_GAP = 30;

/**
 * Calculates start and end offsets for a list of video entries,
 * injecting a 30-second interstitial gap between consecutive videos.
 * There is no trailing gap after the final video (loop wraps immediately).
 */
export function calculateTimeline(videos: VideoEntry[]): TimelineEntry[] {
  const timeline: TimelineEntry[] = [];
  let currentOffset = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const entry: TimelineEntry = {
      ...video,
      start: currentOffset,
      end: currentOffset + video.duration
    };

    timeline.push(entry);

    // Apply gap after each video, except the last one
    if (i < videos.length - 1) {
      currentOffset = entry.end + INTERSTITIAL_GAP;
    }
  }

  return timeline;
}

/**
 * Calculates total loop duration of the entire playlist timeline in seconds.
 * Represented by the end offset of the last timeline entry.
 */
export function getTotalLoopDuration(timeline: TimelineEntry[]): number {
  if (timeline.length === 0) return 0;
  return timeline[timeline.length - 1].end;
}

/**
 * Wraps an absolute timeline position (such as elapsed seconds since epoch)
 * to the loop duration of the active timeline using modulo arithmetic.
 */
export function wrapPosition(position: number, timeline: TimelineEntry[]): number {
  const totalDuration = getTotalLoopDuration(timeline);
  if (totalDuration === 0) return 0;
  return position % totalDuration;
}

/**
 * Finds the currently active video entry at the specified playhead position.
 * Returns null if the position falls inside a 30-second interstitial standby gap
 * or if the timeline is empty.
 */
export function findVideoAtPosition(position: number, timeline: TimelineEntry[]): TimelineEntry | null {
  if (timeline.length === 0) return null;

  for (const entry of timeline) {
    if (position >= entry.start && position < entry.end) {
      return entry;
    }
  }

  return null;
}
