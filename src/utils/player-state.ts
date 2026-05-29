/**
 * CyberPlayer State Machine Helpers
 */

interface PlayerState {
  currentPlaylist: string | null;
  isFloating: boolean;
  isManuallyPip: boolean;
  isMuted: boolean;
}

/**
 * Determines whether the player should float into Picture-in-Picture mode when navigating away from a slot.
 * WHY: The player should only transition to floating/PiP mode if there is an active playlist
 * AND the user has explicitly requested/activated PiP (either isFloating or isManuallyPip is true).
 * Otherwise, it must be destroyed to prevent background audio leaks and optimize resources.
 */
export function shouldFloatToPip(state: PlayerState): boolean {
  if (!state.currentPlaylist) {
    return false;
  }
  return state.isFloating || state.isManuallyPip;
}
