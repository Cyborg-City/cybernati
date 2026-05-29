import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YoutubeApiLoader } from './player-loader';

/**
 * TDD Unit Tests for YoutubeApiLoader ensuring proper queuing, loading, and callback invocation.
 */
describe('YoutubeApiLoader (TDD)', () => {
  let loader: YoutubeApiLoader;

  beforeEach(() => {
    loader = new YoutubeApiLoader();
  });

  it('runs callback immediately if API is already natively ready', () => {
    const callback = vi.fn();
    const hasNativeCheck = vi.fn(() => true);
    const loadScript = vi.fn();

    loader.ensureLoaded(callback, hasNativeCheck, loadScript);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(hasNativeCheck).toHaveBeenCalledTimes(1);
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('queues multiple callbacks and triggers them once loadScript calls onReady', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const hasNativeCheck = vi.fn(() => false);
    let capturedOnReady: (() => void) | null = null;
    const loadScript = vi.fn((onReady) => {
      capturedOnReady = onReady;
    });

    loader.ensureLoaded(cb1, hasNativeCheck, loadScript);
    loader.ensureLoaded(cb2, hasNativeCheck, loadScript);

    expect(loadScript).toHaveBeenCalledTimes(1);
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();

    if (capturedOnReady) {
      (capturedOnReady as () => void)();
    }

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
