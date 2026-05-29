import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PLAYER_STORAGE_KEYS,
  getPlayerStorage,
  setPlayerStorage,
  restorePipSize
} from './player-storage';

describe('Player Storage Utility (TDD)', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
      clear: () => { store = {}; }
    };
  })();

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('PLAYER_STORAGE_KEYS', () => {
    it('contains all 7 keys as readonly constraints', () => {
      expect(PLAYER_STORAGE_KEYS.PLAYING).toBe('cyber-player-playing');
      expect(PLAYER_STORAGE_KEYS.VOLUME).toBe('cyber-player-volume');
      expect(PLAYER_STORAGE_KEYS.MUTED).toBe('cyber-player-muted');
      expect(PLAYER_STORAGE_KEYS.PLAYLIST).toBe('cyber-player-pip-playlist');
      expect(PLAYER_STORAGE_KEYS.PIP_WIDTH).toBe('cyber-player-pip-width');
      expect(PLAYER_STORAGE_KEYS.PIP_HEIGHT).toBe('cyber-player-pip-height');
      expect(PLAYER_STORAGE_KEYS.HANDSHAKE).toBe('cyber-player-handshake');
    });
  });

  describe('getPlayerStorage', () => {
    it('retrieves values from localStorage using stubbed API', () => {
      localStorageMock.setItem('cyber-player-volume', '42');
      const val = getPlayerStorage(PLAYER_STORAGE_KEYS.VOLUME);
      expect(val).toBe('42');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cyber-player-volume');
    });
  });

  describe('setPlayerStorage', () => {
    it('sets values in localStorage using stubbed API', () => {
      setPlayerStorage(PLAYER_STORAGE_KEYS.MUTED, 'true');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cyber-player-muted', 'true');
    });
  });

  describe('restorePipSize', () => {
    it('applies custom dimensions to element styles when saved in storage', () => {
      localStorageMock.setItem('cyber-player-pip-width', '400');
      localStorageMock.setItem('cyber-player-pip-height', '225');

      const style = { width: '', height: '' };
      const mockEl = { style } as unknown as HTMLElement;

      restorePipSize(mockEl);

      expect(style.width).toBe('400px');
      expect(style.height).toBe('225px');
    });

    it('leaves styles untouched when storage contains no custom dimensions', () => {
      const style = { width: 'original-w', height: 'original-h' };
      const mockEl = { style } as unknown as HTMLElement;

      restorePipSize(mockEl);

      expect(style.width).toBe('original-w');
      expect(style.height).toBe('original-h');
    });

    it('does not throw when element is null', () => {
      expect(() => restorePipSize(null)).not.toThrow();
    });
  });
});
