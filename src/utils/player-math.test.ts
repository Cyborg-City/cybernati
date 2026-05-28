import { describe, it, expect } from 'vitest';
import { toLogVolume } from './player-math';

describe('Player Math', () => {
  describe('toLogVolume', () => {
    it('maps 0% linear to 0% audio', () => {
      expect(toLogVolume(0)).toBe(0);
    });

    it('maps 100% linear to 100% audio', () => {
      expect(toLogVolume(100)).toBe(100);
    });

    it('maps 50% linear to 25% audio (squared curve)', () => {
      expect(toLogVolume(50)).toBe(25);
    });

    it('handles negative inputs gracefully', () => {
      expect(toLogVolume(-10)).toBe(0);
    });

    it('handles >100 inputs gracefully', () => {
      expect(toLogVolume(150)).toBe(100);
    });
  });
});
