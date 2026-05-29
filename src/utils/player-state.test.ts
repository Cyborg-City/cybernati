import { describe, it, expect } from 'vitest';
import { shouldFloatToPip } from './player-state';

describe('CyberPlayer Transition State Machine (TDD)', () => {
  describe('shouldFloatToPip', () => {
    it('returns true when currentPlaylist is active and player is explicitly floating', () => {
      // DAMP test: Descriptive and Meaningful Phrases
      const state = {
        currentPlaylist: 'channel-000',
        isFloating: true,
        isManuallyPip: false,
        isMuted: false
      };
      
      expect(shouldFloatToPip(state)).toBe(true);
    });

    it('returns true when currentPlaylist is active and player was manually set to PiP', () => {
      const state = {
        currentPlaylist: 'channel-000',
        isFloating: false,
        isManuallyPip: true,
        isMuted: false
      };
      
      expect(shouldFloatToPip(state)).toBe(true);
    });

    it('returns false when currentPlaylist is active but user did NOT explicitly request PiP (even if unmuted)', () => {
      // Beyonce rule: If the user didn't explicitly click PiP, don't let it follow them!
      const state = {
        currentPlaylist: 'channel-000',
        isFloating: false,
        isManuallyPip: false,
        isMuted: false // unmuted
      };
      
      expect(shouldFloatToPip(state)).toBe(false);
    });

    it('returns false when no current playlist is active (idle/closed)', () => {
      const state = {
        currentPlaylist: null,
        isFloating: true,
        isManuallyPip: true,
        isMuted: false
      };
      
      expect(shouldFloatToPip(state)).toBe(false);
    });
  });
});
