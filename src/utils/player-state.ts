/**
 * CyberPlayer State Machine Helpers
 */

/**
 * Interface representing the state of the CyberPlayer required for transition decisions.
 */
interface PlayerState {
  /** The current active playlist ID, or null if no playlist is loaded. */
  currentPlaylist: string | null;
  /** Whether the player is currently in floating (PiP) mode. */
  isFloating: boolean;
  /** Whether the user has explicitly requested Picture-in-Picture mode manually. */
  isManuallyPip: boolean;
  /** Whether the player is currently muted. */
  isMuted: boolean;
}

/**
 * Determines whether the player should float into Picture-in-Picture mode when navigating away from a slotted page.
 * 
 * @param state - The current state of the player.
 * @returns True if the player should transition to floating/PiP mode; false if it should be destroyed.
 * 
 * @remarks
 * **Why this is needed:** PiP mode is strictly opt-in to prevent background audio leaks.
 * We only let the player float if there is an active playlist AND the user has explicitly enabled/requested
 * PiP (either `isFloating` or `isManuallyPip` is active).
 * If the user did not explicitly toggle PiP, the player must be completely halted and destroyed on navigation.
 */
export function shouldFloatToPip(state: PlayerState): boolean {
  if (!state.currentPlaylist) {
    return false;
  }
  return state.isFloating || state.isManuallyPip;
}
