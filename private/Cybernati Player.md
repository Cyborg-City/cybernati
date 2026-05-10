---
created: 2026-05-10T11:09:45-05:00
modified: 2026-05-10T12:45:00-05:00
---
# Cybernati™ Player: Channel Zero

A terminal-based video multiplexer simulating a clandestine OTA (Over-The-Air) broadcast. It utilizes linear synchronization to ensure all viewers are witnessing the same signal at the same absolute second.

## 1. Core Architecture (Multiplexer)
The player is a shell that mounts specialized source modules based on the `video_playlist.json` schedule.

### Source Types:
- **`youtube`**: Controlled via IFrame Player API. Supports seeking and custom volume.
- **`direct`**: (DVIDS, Local MP4). Uses HTML5 video tag for perfect sync.
- **`standby`**: Silent local interstitial loop used during "ALIGNING" phases.

## 2. Vault Integration (The Bridge)
The player is an interactive extension of the Cybernati™ archives.
- **Base-Aware Management**: The `generate-playlist.mjs` script queries `video_archive/channel-0000.base` to determine the active schedule and sort order.
- **Duration Caching**: The script automatically scrapes YouTube durations and saves them back to the vault as a `duration` property using the Obsidian CLI.
- **Active Context**: 
    - **Header**: Dynamically displays the **Video Title** of the current transmission.
    - **Footer**: Dynamically displays **Related Notes** as interactive Wikilinks.

## 3. Technical Requirements
- **Cycle**: 5m 30s fixed slots (300s Intelligence + 30s Standby).
- **The Sync Lock**: Visual time-decay indicator (99.9% to 0.1%).
- **The Handshake**: Invisible handshake unmutes audio at 25% upon first user interaction (click/keypress).
- **Silent Standby**: Interstitials are forced-silent; user volume only applies to Intelligence slots.

## 4. Feature Roadmap
- [x] **MVP**: YouTube linear sync terminal.
- [x] **Handshake Logic**: Muted start with unmuting on interaction.
- [x] **Title & Link Injection**: Dynamic metadata integration from the vault.
- [x] **Base-Aware Controller**: Visual playlist management via Obsidian Bases.
- [ ] **Direct Module**: Support for non-YouTube video sources (DVIDS).
- [ ] **Signal Degradation Phase II**: Refined visual static and jitter effects.




| status  |     | volume |
| ------- | --- | ------ |
| related |     | desync |
| Embed   |     |        |


---
*The System Is Performing as Intended.*
