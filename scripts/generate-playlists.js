#!/usr/bin/env node

/**
 * Cybernati Playlist Generator
 * 
 * Compiles media markdown files into synchronized JSON playlists.
 * Integrates directly with Astro build-time deployment.
 */

import { promises as fs } from 'fs';
import path from 'path';

// --- SELF-CONTAINED UTILITIES (TDD Core Logic DRYness) ---

function extractYouTubeId(url) {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
  } catch (e) {}
  return null;
}

function parseISODuration(durationStr) {
  if (!durationStr) return 0;
  const clean = durationStr.toString().trim();
  if (!clean) return 0;
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }
  if (/^PT\d+$/i.test(clean)) {
    return parseInt(clean.substring(2), 10);
  }
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

function calculateTimeline(videos) {
  const timeline = [];
  let currentOffset = 0;
  const INTERSTITIAL_GAP = 30;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const entry = {
      ...video,
      start: currentOffset,
      end: currentOffset + video.duration
    };
    timeline.push(entry);
    if (i < videos.length - 1) {
      currentOffset = entry.end + INTERSTITIAL_GAP;
    }
  }
  return timeline;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Simple frontmatter parser
function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  
  const yamlText = match[1];
  const result = { related: [] };
  const lines = yamlText.split('\n');
  let currentKey = null;
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Check if it's a list item for the current key
    if (trimmed.startsWith('-') && currentKey === 'related') {
      let val = trimmed.substring(1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      result.related.push(val);
      continue;
    }
    if (trimmed.startsWith('-') && currentKey === 'aliases') {
      let val = trimmed.substring(1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      result.aliases = result.aliases || [];
      result.aliases.push(val);
      continue;
    }
    
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    
    const key = line.substring(0, colonIdx).trim();
    let val = line.substring(colonIdx + 1).trim();
    
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    
    currentKey = key;
    
    if (key === 'title') {
      result.title = val;
    } else if (key === 'source') {
      result.source = val;
    } else if (key === 'duration') {
      result.duration = val;
    } else if (key === 'draft') {
      result.draft = val === 'true';
    } else if (key === 'date') {
      result.date = val;
    } else if (key === 'aliases') {
      if (val.startsWith('[') && val.endsWith(']')) {
        result.aliases = val.substring(1, val.length - 1).split(',').map(s => s.trim()).filter(Boolean);
      } else {
        result.aliases = [];
      }
    } else if (key === 'related') {
      if (val.startsWith('[') && val.endsWith(']')) {
        result.related = val.substring(1, val.length - 1).split(',').map(s => s.trim()).filter(Boolean);
      } else {
        result.related = [];
      }
    }
  }
  return result;
}

// Recursively traverse a folder to find markdown files
async function getMarkdownFiles(dir) {
  const files = [];
  try {
    const items = await fs.readdir(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        const subFiles = await getMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (/\.(md|mdx)$/i.test(item)) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  return files;
}

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// --- MAIN GENERATION PIPELINE ---

async function run() {
  console.log("📺 Running Cybernati Playlist Generation Script...");

  try {
    const vaultDir = path.resolve('src/content');
    const mediaDir = path.join(vaultDir, 'media');

    // 1. Build the Link Resolver Map across all other content folders
    const allWikilinkTargets = new Map();
    const collections = ['posts', 'pages', 'projects', 'docs', 'dossier', 'vault', 'special'];
    
    for (const col of collections) {
      const colDir = path.join(vaultDir, col);
      const files = await getMarkdownFiles(colDir);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const fm = parseFrontmatter(content);
        if (!fm || fm.draft) continue;

        const fileBasename = path.basename(file, path.extname(file));
        
        // Compute relative published Astro URL
        let relativeUrl = '';
        if (col === 'special') {
          if (fileBasename === 'home') relativeUrl = '/';
          else if (fileBasename === '404') relativeUrl = '/404';
          else relativeUrl = `/${fileBasename}`;
        } else if (col === 'pages') {
          relativeUrl = fileBasename === 'index' ? '/' : `/${fileBasename}`;
        } else {
          relativeUrl = `/${col}/${fileBasename}/`;
        }

        const targetData = { name: fm.title || fileBasename, slug: relativeUrl };

        // Map by filename, title, and aliases
        allWikilinkTargets.set(fileBasename.toLowerCase(), targetData);
        if (fm.title) {
          allWikilinkTargets.set(fm.title.toLowerCase(), targetData);
        }
        if (fm.aliases && Array.isArray(fm.aliases)) {
          for (const alias of fm.aliases) {
            allWikilinkTargets.set(alias.toLowerCase(), targetData);
          }
        }
      }
    }

    // Helper to resolve raw wikilink to name and slug
    function resolveWikilink(linkStr) {
      // Strip [[ and ]]
      const cleanLink = linkStr.replace(/[\[\]]/g, '').trim();
      if (!cleanLink) return null;

      const parts = cleanLink.split('|');
      const target = parts[0].trim();
      const alias = parts.length > 1 ? parts[1].trim() : null;

      const targetData = allWikilinkTargets.get(target.toLowerCase());
      if (targetData) {
        return {
          name: alias || targetData.name,
          slug: targetData.slug
        };
      }

      // Safe fallback if target note is missing
      return {
        name: alias || target,
        slug: `/posts/${target}/`
      };
    }

    // 2. Scan all media files under src/content/media/
    const mediaFiles = await getMarkdownFiles(mediaDir);
    const mediaItems = [];

    for (let file of mediaFiles) {
      const fileBasename = path.basename(file, path.extname(file));
      const expectedSlug = slugify(fileBasename);

      // AUTOMATED DISK RENAMING: If the filename contains spaces or un-slugified characters,
      // physically rename the file on disk to maintain a pristine, standardized vault!
      if (fileBasename !== expectedSlug) {
        const dir = path.dirname(file);
        const ext = path.extname(file);
        const newPath = path.join(dir, `${expectedSlug}${ext}`);
        
        console.log(`✏️  Auto-slugifying media filename: "${fileBasename}" -> "${expectedSlug}"`);
        try {
          await fs.rename(file, newPath);
          file = newPath; // Update reference to read from the new path
        } catch (e) {
          console.error(`⚠️  Failed to rename file "${file}" to "${newPath}":`, e.message);
        }
      }

      const content = await fs.readFile(file, 'utf-8');
      const fm = parseFrontmatter(content);
      if (!fm || fm.draft) continue;

      const source = fm.source || '';
      const ytId = extractYouTubeId(source);
      if (!ytId) {
        // Skip files that don't have a valid YouTube source
        continue;
      }

      const durationSec = parseISODuration(fm.duration);
      if (durationSec <= 0) {
        // Skip if duration is invalid or 0
        continue;
      }

      const relativeToMedia = path.relative(mediaDir, file);
      const relativeParts = relativeToMedia.split(path.sep);

      // We expect: [type (audio/video), playlistFolder, fileName.md]
      const type = relativeParts[0]; // e.g. "video" or "audio"
      const playlist = relativeParts.length > 2 ? relativeParts[1] : 'default';

      // Resolve related wikilinks
      const resolvedRelated = [];
      if (fm.related && Array.isArray(fm.related)) {
        for (const r of fm.related) {
          const resolved = resolveWikilink(r);
          if (resolved) resolvedRelated.push(resolved);
        }
      }

      mediaItems.push({
        id: ytId,
        title: fm.title || fileBasename,
        duration: durationSec,
        related: resolvedRelated,
        date: fm.date ? new Date(fm.date).getTime() : 0,
        type,
        playlist
      });
    }

    // 3. Group and process playlists
    const playlists = {};

    for (const item of mediaItems) {
      const key = `${item.type}/${item.playlist}`;
      playlists[key] = playlists[key] || [];
      playlists[key].push(item);
    }

    const interstitials = [
      "/static/interstitials/int-01.mp4",
      "/static/interstitials/int-02.mp4",
      "/static/interstitials/int-03.mp4"
    ];

    // Build default video/channel-000 list containing all video media items sorted by date
    const allVideos = mediaItems
      .filter(item => item.type === 'video')
      .sort((a, b) => a.date - b.date);

    if (allVideos.length > 0) {
      const channelSchedule = calculateTimeline(allVideos);
      const totalDuration = channelSchedule.length > 0 ? channelSchedule[channelSchedule.length - 1].end : 0;
      
      const channelPlaylist = {
        totalLoopDuration: totalDuration,
        schedule: channelSchedule,
        interstitials
      };

      const outDir = path.resolve('public/api/playlists/video');
      await ensureDir(outDir);
      await fs.writeFile(
        path.join(outDir, 'channel-000.json'),
        JSON.stringify(channelPlaylist, null, 2),
        'utf-8'
      );
      console.log(`✅ Emitted channel-000 playlist with ${allVideos.length} videos.`);
    }

    // Process specific sub-folder playlists
    for (const [key, items] of Object.entries(playlists)) {
      const [type, playlistName] = key.split('/');
      
      // Sort items by date ascending
      items.sort((a, b) => a.date - b.date);

      const schedule = calculateTimeline(items);
      const totalDuration = schedule.length > 0 ? schedule[schedule.length - 1].end : 0;

      const playlistOutput = {
        totalLoopDuration: totalDuration,
        schedule,
        interstitials
      };

      const outDir = path.resolve(`public/api/playlists/${type}`);
      await ensureDir(outDir);
      await fs.writeFile(
        path.join(outDir, `${playlistName}.json`),
        JSON.stringify(playlistOutput, null, 2),
        'utf-8'
      );
      console.log(`✅ Emitted ${type}/${playlistName} playlist with ${items.length} items.`);
    }

    console.log("🎉 Cybernati Playlist Generation complete!");

  } catch (error) {
    // FAIL-SAFE: Log the error, but do not block the build process!
    console.error("⚠️ [Playlist Generation Error] Script encountered a failure:");
    console.error(error);
    process.exit(0);
  }
}

run();
