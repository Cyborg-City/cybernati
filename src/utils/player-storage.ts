/**
 * TSDoc: Player Storage Utility
 * 
 * WHY: Centralizes all localStorage keys and operations for the CyberPlayer.
 * This completely eliminates raw, duplicate magic strings across the CyberPlayer
 * component which could easily diverge or suffer from typos. It also isolates and
 * encapsulates the local storage interaction for robust unit testing.
 */

export const PLAYER_STORAGE_KEYS = {
  PLAYING:    'cyber-player-playing',
  VOLUME:     'cyber-player-volume',
  MUTED:      'cyber-player-muted',
  PLAYLIST:   'cyber-player-pip-playlist',
  PIP_WIDTH:  'cyber-player-pip-width',
  PIP_HEIGHT: 'cyber-player-pip-height',
  HANDSHAKE:  'cyber-player-handshake',
} as const;

export type PlayerStorageKey = typeof PLAYER_STORAGE_KEYS[keyof typeof PLAYER_STORAGE_KEYS];

/**
 * WHY: Safely retrieves a value from localStorage for a given typed key.
 */
export function getPlayerStorage(key: PlayerStorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

/**
 * WHY: Safely sets a value in localStorage for a given typed key.
 */
export function setPlayerStorage(key: PlayerStorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Fail silently in environments where localStorage is blocked (e.g. iframes, third-party cookies disabled)
  }
}

/**
 * WHY: Restores custom saved PiP dimensions onto an HTML element if they exist in localStorage.
 * Encapsulating this here avoids duplicate manual restoration blocks and ensures styling matches.
 */
export function restorePipSize(el: HTMLElement | null): void {
  if (!el) return;
  const savedWidth = getPlayerStorage(PLAYER_STORAGE_KEYS.PIP_WIDTH);
  const savedHeight = getPlayerStorage(PLAYER_STORAGE_KEYS.PIP_HEIGHT);
  if (savedWidth && savedHeight) {
    el.style.width = `${savedWidth}px`;
    el.style.height = `${savedHeight}px`;
  }
}
