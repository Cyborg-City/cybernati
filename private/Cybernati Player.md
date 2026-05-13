---
created: 2026-05-10T11:09:45-05:00
modified: 2026-05-13T03:33:49-05:00
---
# Cybernati™ Player: Channel Zero

A terminal-based video multiplexer simulating a clandestine OTA (Over-The-Air) broadcast. It utilizes linear synchronization (Unix Epoch Modulo) to ensure all viewers are witnessing the same signal at the same absolute second.

## Technical Overview

**Primary Script**: `quartz/plugins/emitters/broadcast.ts`

This is a Quartz emitter plugin that runs during `quartz build`. It generates:
- `public/static/video_playlist.json` — the playlist schedule
- `player.html` — standalone player page (embedded-ready)

### How It Works

1. **Reads** video markdown files from `video_archive/`
2. **Parses** `video_archive/channel-0000.base` for filter/sort rules (YAML format)
3. **Fetches** YouTube video durations (with caching via YouTubeProvider)
4. **Calculates** timeline positions:
   - Each video plays in full (variable duration)
   - 30-second interstitial gap between videos
   - Total loop duration = sum of all videos + gaps
5. **Emits** the playlist JSON during build

### Architecture (4 Modules)

| Module | Responsibility |
|--------|----------------|
| `BaseParser` | Parses channel-0000.base YAML into filter/sort rules |
| `YouTubeProvider` | YouTube ID extraction, duration fetching, caching |
| `TimelineEngine` | Pure timeline math (start/end times, loop wrapping) |
| `LinkResolver` | Maps Wikilinks to Quartz slugs for related notes |

### Related Files

| File | Purpose |
|------|---------|
| `video_archive/` | Source folder with video markdown files |
| `video_archive/channel-0000.base` | Filter/sort configuration (YAML) |
| `public/static/video_playlist.json` | Generated playlist output |
| `quartz/plugins/emitters/broadcast.test.ts` | Unit tests |

### Playlist JSON Structure

```json
{
  "totalLoopDuration": 50196,
  "schedule": [
    { "id": "YouTubeID", "title": "...", "duration": 8627, "start": 0, "end": 8627, "related": [...] }
  ],
  "interstitials": ["/static/interstitials/int-01.mp4", ...]
}
```

### Running the Player

The player is automatically built into the site. For standalone embed:
- Access `player.html` directly
- Use the [EMBED] button to get iframe code

---
working on:

videos are getting out of hand. finding weird stuff that is fun to watch and think about but i can't write notes for them all. can't keep up. i don't even know what to write for some of this weird ass shit. 

we'll set up the desync later to only play these oddities. 

some of these notes are just things i want to write about but haven't found time.

adding subdirectories to categorize videos. 
# future
add the ability to embed a video by note name. 
For example: [[The Colony of Roanoke’s Mysterious Disappearance  The UnXplained (Season 3)  History]]

```
https://cyborg-city.github.io/Cybernati/player.html?=The-Colony-of-Roanokes-Mysterious-Disappearance--The-UnXplained-Season-3--History.md
```

would result in the cybernati player with that video
we can also make it so that if can play other sources like from Internet Archive and maybe twitter.

* also should add PIP

---
*The System Is Performing as Intended.*
*Reference ID: CN-PL-MOD-02*