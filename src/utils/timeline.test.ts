import { describe, it, expect } from 'vitest';
import {
  calculateTimeline,
  getTotalLoopDuration,
  findVideoAtPosition,
  wrapPosition,
  type VideoEntry,
  type TimelineEntry
} from './timeline';

// DAMP Mock Playlist Data
const mockVideos: VideoEntry[] = [
  {
    id: 'vid1',
    title: 'UFO Sighting Mt Rainier',
    duration: 100,
    related: [{ name: 'Ken Arnold', slug: 'ken-arnold' }]
  },
  {
    id: 'vid2',
    title: 'Quantum Double Slit Experiment',
    duration: 200,
    related: [{ name: 'Quantum Theory', slug: 'quantum-theory' }]
  },
  {
    id: 'vid3',
    title: 'The Glitch in Reality',
    duration: 150,
    related: []
  }
];

describe('Timeline Engine - Timeline Calculation', () => {
  it('should return an empty timeline array when provided with no videos', () => {
    const result = calculateTimeline([]);
    expect(result).toEqual([]);
  });

  it('should calculate correct start/end offsets for a single-video playlist without any trailing gap', () => {
    const singleVideoList: VideoEntry[] = [mockVideos[0]];
    const result = calculateTimeline(singleVideoList);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('vid1');
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(100);
  });

  it('should correctly calculate start/end offsets for multiple videos with exactly a 30-second gap between each and no trailing gap after the last one', () => {
    const result = calculateTimeline(mockVideos);
    
    expect(result).toHaveLength(3);

    // Video 1
    expect(result[0].id).toBe('vid1');
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(100);

    // 30s Interstitial Gap between Video 1 & Video 2
    // Video 2 starts at 100 + 30 = 130
    expect(result[1].id).toBe('vid2');
    expect(result[1].start).toBe(130);
    expect(result[1].end).toBe(330); // 130 + 200

    // 30s Interstitial Gap between Video 2 & Video 3
    // Video 3 starts at 330 + 30 = 360
    expect(result[2].id).toBe('vid3');
    expect(result[2].start).toBe(360);
    expect(result[2].end).toBe(510); // 360 + 150
  });
});

describe('Timeline Engine - Loop Duration & Wrapping', () => {
  it('should calculate the total loop duration as the end time of the final video in the timeline', () => {
    const timeline = calculateTimeline(mockVideos);
    const result = getTotalLoopDuration(timeline);
    expect(result).toBe(510);
  });

  it('should return 0 loop duration for an empty timeline', () => {
    const result = getTotalLoopDuration([]);
    expect(result).toBe(0);
  });

  it('should wrap absolute system times correctly using the total playlist loop duration', () => {
    const timeline = calculateTimeline(mockVideos);
    
    // Position within first loop
    expect(wrapPosition(250, timeline)).toBe(250);

    // Position wrapping exactly once
    expect(wrapPosition(560, timeline)).toBe(50); // 560 % 510

    // Position wrapping multiple times
    expect(wrapPosition(1070, timeline)).toBe(50); // 1070 % 510
  });
});

describe('Timeline Engine - Video Lookup by Position', () => {
  it('should return the correct active video when the playhead position lands inside a video playback window', () => {
    const timeline = calculateTimeline(mockVideos);

    // Playhead is in Video 1 (0 to 100)
    const active1 = findVideoAtPosition(50, timeline);
    expect(active1).not.toBeNull();
    expect(active1!.id).toBe('vid1');

    // Playhead is in Video 2 (130 to 330)
    const active2 = findVideoAtPosition(200, timeline);
    expect(active2).not.toBeNull();
    expect(active2!.id).toBe('vid2');

    // Playhead is in Video 3 (360 to 510)
    const active3 = findVideoAtPosition(400, timeline);
    expect(active3).not.toBeNull();
    expect(active3!.id).toBe('vid3');
  });

  it('should return null when the playhead position lands inside a 30-second interstitial standby gap', () => {
    const timeline = calculateTimeline(mockVideos);

    // Land in gap between Video 1 & Video 2 (100 to 130)
    const active1 = findVideoAtPosition(115, timeline);
    expect(active1).toBeNull();

    // Land in gap between Video 2 & Video 3 (330 to 360)
    const active2 = findVideoAtPosition(345, timeline);
    expect(active2).toBeNull();
  });

  it('should return null when lookup is performed on an empty timeline', () => {
    const result = findVideoAtPosition(50, []);
    expect(result).toBeNull();
  });
});
