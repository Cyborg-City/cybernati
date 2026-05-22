import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex, getContrastingTextColor } from './graph-theme-colors';

describe('graph-theme-colors helper functions', () => {
  describe('hexToRgb', () => {
    it('should convert standard hex colors to RGB object', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#38bdf8')).toEqual({ r: 56, g: 189, b: 248 });
    });

    it('should work without the leading hash symbol', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle uppercase hex correctly', () => {
      expect(hexToRgb('#FF5733')).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('should return null for invalid hex strings', () => {
      expect(hexToRgb('#fff')).toBeNull();
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#12345g')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB values to standard hex color string', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(56, 189, 248)).toBe('#38bdf8');
    });

    it('should pad single-digit hex segments with leading zeros', () => {
      expect(rgbToHex(15, 9, 3)).toBe('#0f0903');
    });
  });

  describe('getContrastingTextColor', () => {
    it('should return black for light backgrounds', () => {
      expect(getContrastingTextColor('#ffffff')).toBe('#000000');
      expect(getContrastingTextColor('#f8fafc')).toBe('#000000');
      expect(getContrastingTextColor('#e2e8f0')).toBe('#000000');
    });

    it('should return white for dark backgrounds', () => {
      expect(getContrastingTextColor('#000000')).toBe('#ffffff');
      expect(getContrastingTextColor('#1e293b')).toBe('#ffffff');
      expect(getContrastingTextColor('#0f172a')).toBe('#ffffff');
    });

    it('should return black for invalid hex values as a default safety measure', () => {
      expect(getContrastingTextColor('invalid')).toBe('#000000');
    });
  });
});
