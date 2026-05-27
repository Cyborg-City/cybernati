/**
 * Cybernati Media Utilities
 * Production Implementation
 */

/**
 * Extracts the 11-character YouTube video ID from various URL formats.
 * Supported formats:
 * - Standard watch URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - watch with extra params: https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s
 * - Short URL: https://youtu.be/dQw4w9WgXcQ
 * - Embed URL: https://www.youtube.com/embed/dQw4w9WgXcQ
 * - Shorts URL: https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - Clean ID directly: dQw4w9WgXcQ
 * 
 * Returns null for invalid or non-YouTube URLs.
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;
  
  // If it's already a clean 11-character YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }
  
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);
    
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
  } catch (e) {
    // Fail silently and return null
  }
  
  return null;
}

/**
 * Parses an ISO 8601 duration string into total seconds.
 * Supports standard formats:
 * - PT27M27S -> 1647
 * - PT1H12M30S -> 4350
 * - PT2H -> 7200
 * - PT45M -> 2700
 * - PT50S -> 50
 * - Clipper raw seconds with PT prefix: PT1647 -> 1647
 * - Clipper raw numeric string: "1647" -> 1647
 * 
 * Returns 0 for invalid or empty formats.
 */
export function parseISODuration(durationStr: string | null | undefined): number {
  if (!durationStr) return 0;
  
  const clean = durationStr.trim();
  if (!clean) return 0;
  
  // 1. Check if it's a raw number (e.g. "1647")
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }
  
  // 2. Check if it's just "PT" followed by a raw number (e.g. "PT1647")
  if (/^PT\d+$/i.test(clean)) {
    return parseInt(clean.substring(2), 10);
  }
  
  // 3. Parse standard ISO 8601 duration format (e.g. PT1H12M30S)
  const isoRegex = /^PT(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?$/i;
  const matches = clean.match(isoRegex);
  
  if (matches) {
    const hours = matches[1] ? parseInt(matches[1], 10) : 0;
    const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
    const seconds = matches[3] ? parseInt(matches[3], 10) : 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  return 0;
}
