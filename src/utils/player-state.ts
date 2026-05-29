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

/**
 * Interface representing the state of the player and slot to decide whether to dock.
 */
interface DockDecisionState {
  /** Whether there is a valid player slot on the current page. */
  hasSlot: boolean;
  /** Whether the user has explicitly requested PiP manually. */
  isManuallyPip: boolean;
  /** The currently playing playlist ID. */
  currentPlaylist: string | null;
  /** The currently playing feed type. */
  currentType: string | null;
  /** The playlist ID specified by the new page's slot. */
  slotPlaylist: string | null;
  /** The feed type specified by the new page's slot. */
  slotType: string | null;
}

/**
 * Determines whether the persistent player should dock into a slot on a page.
 * 
 * @param state - The current state of the player and the slot.
 * @returns True if the player should dock; false if it should remain floating (or be destroyed).
 * 
 * @remarks
 * **Why this is needed:** This prevents layout thrashing, audio interruption, and mute-resets
 * when navigating between pages that share the SAME video slot (e.g. going from post -> homepage).
 * We only auto-dock the player if the user is NOT manually floating it, OR if the slot on the
 * destination page is a DIFFERENT video/playlist than the currently playing one.
 */
export function shouldDockToSlot(state: DockDecisionState): boolean {
  if (!state.hasSlot) {
    return false;
  }
  const isDifferentVideo = state.currentPlaylist !== state.slotPlaylist || state.currentType !== state.slotType;
  return !state.isManuallyPip || isDifferentVideo;
}
