import { describe, it, expect, vi } from 'vitest';
import { openPanel, closePanel, withNoTransition } from './player-ui-helpers';

describe('Player UI Helpers (TDD)', () => {
  describe('openPanel', () => {
    it('applies max-h-[300px] and opacity-100, and removes max-h-0 and opacity-0', () => {
      const classList = {
        remove: vi.fn(),
        add: vi.fn()
      };
      const mockEl = { classList } as unknown as HTMLElement;

      openPanel(mockEl);

      expect(classList.remove).toHaveBeenCalledWith('max-h-0', 'opacity-0');
      expect(classList.add).toHaveBeenCalledWith('max-h-[300px]', 'opacity-100');
    });

    it('does not throw when element is null', () => {
      expect(() => openPanel(null)).not.toThrow();
    });
  });

  describe('closePanel', () => {
    it('applies max-h-0 and opacity-0, and removes max-h-[300px] and opacity-100', () => {
      const classList = {
        remove: vi.fn(),
        add: vi.fn()
      };
      const mockEl = { classList } as unknown as HTMLElement;

      closePanel(mockEl);

      expect(classList.add).toHaveBeenCalledWith('max-h-0', 'opacity-0');
      expect(classList.remove).toHaveBeenCalledWith('max-h-[300px]', 'opacity-100');
    });

    it('does not throw when element is null', () => {
      expect(() => closePanel(null)).not.toThrow();
    });
  });

  describe('withNoTransition', () => {
    it('adds no-transition, executes callback, reads offsetHeight, and removes no-transition', () => {
      const classList = {
        add: vi.fn(),
        remove: vi.fn()
      };
      let callbackRun = false;
      const callback = () => { callbackRun = true; };
      
      const mockEl = {
        classList,
        get offsetHeight() { return 42; }
      } as unknown as HTMLElement;
      
      withNoTransition(mockEl, callback);
      
      expect(classList.add).toHaveBeenCalledWith('no-transition');
      expect(callbackRun).toBe(true);
      expect(classList.remove).toHaveBeenCalledWith('no-transition');
    });

    it('does not throw when element is null', () => {
      expect(() => withNoTransition(null, () => {})).not.toThrow();
    });
  });
});
