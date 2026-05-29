const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/pages/player/[type]/[playlist].astro');
const destPath = path.join(__dirname, '../src/components/CybernatiPlayer.astro');

const content = fs.readFileSync(srcPath, 'utf8');

// Extract style
const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
const styleContent = styleMatch ? styleMatch[1] : '';

// Extract HTML inside #player-root
// Find start of <div id="player-root" ...> and end of it
const rootStart = content.indexOf('<div id="player-root"');
const scriptStart = content.indexOf('<script define:vars=');
const htmlContent = content.substring(rootStart, scriptStart).trim();

// Extract Script
const scriptMatch = content.match(/<script define:vars=\{\{ type, playlist, base \}\}>([\s\S]*?)<\/script>/);
let scriptContent = scriptMatch ? scriptMatch[1] : '';

// Replace `toLogVolume` with the one from our math util? Or just keep it for now.
// I'll keep the internal one to minimize bugs right now, then refactor it using replace_file_content after.

const newAstroContent = `---
import { getBaseUrl } from '@/utils/url-helpers';
const base = getBaseUrl();
---

<div id="global-cyber-player" class="cyber-player-hidden" style="display: none; position: fixed; bottom: 20px; right: 20px; width: 320px; height: 180px; z-index: 9999;">
${htmlContent}
</div>

<style is:global>
${styleContent}

/* Global specific styles for transition and layout */
#global-cyber-player {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
#global-cyber-player.is-slotted {
  position: relative !important;
  bottom: auto !important;
  right: auto !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 10 !important;
  display: flex !important;
}
#global-cyber-player.is-pip {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  width: 320px !important;
  height: 180px !important;
  z-index: 9999 !important;
  display: flex !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--cyber-primary);
}
#global-cyber-player.is-hidden {
  display: none !important;
}

/* Hide header/footer in PiP */
#global-cyber-player.is-pip header,
#global-cyber-player.is-pip footer,
#global-cyber-player.is-pip #related-notes-panel {
  display: none !important;
}
#global-cyber-player.is-pip #player-root {
  padding: 0 !important;
}
#global-cyber-player.is-pip #player-viewport {
  border: none !important;
  border-radius: 0 !important;
  height: 100% !important;
  width: 100% !important;
}
</style>

<script>
  import { toLogVolume } from '@/utils/player-math';
  
  // We need to inject base URL dynamically or get it from window
  const base = window.location.pathname.startsWith('/cybernati/') ? '/cybernati/' : '/';

  // We wrap the extracted script in an IIFE and replace dynamic Astro vars
  let type = 'video';
  let playlist = 'channel-000';

${scriptContent}
</script>
`;

fs.writeFileSync(destPath, newAstroContent, 'utf8');
console.log('Successfully generated CybernatiPlayer.astro');
