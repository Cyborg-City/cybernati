/**
 * YoutubeApiLoader
 * 
 * WHY: This class manages the asynchronous loading of the YouTube IFrame Player API.
 * By decoupling the API ready-checking and script loading from the main CybernatiPlayer
 * Astro component, we achieve:
 * 1. Single Responsibility Principle (SOLID): The loader only manages YouTube API script lifecycle and queue.
 * 2. High Testability: The queuing logic can be unit-tested without a real browser window or DOM.
 * 3. Prevention of Race Conditions: If multiple mount requests happen in rapid succession before the script loads,
 *    callbacks are cleanly queued and fired exactly once the API signal becomes active.
 */
export class YoutubeApiLoader {
  private queue: (() => void)[] = [];
  private isScriptAdded = false;

  /**
   * Schedules a callback to run once the YouTube IFrame API is loaded and ready.
   * 
   * @param callback - The function to run when the API is ready.
   * @param hasNativeCheck - A function to check if the YT API is natively ready.
   * @param loadScript - A function to inject the script tag and invoke the onReady callback when the tag loads.
   */
  public ensureLoaded(
    callback: () => void,
    hasNativeCheck: () => boolean,
    loadScript: (onReady: () => void) => void
  ): void {
    if (hasNativeCheck()) {
      callback();
      return;
    }

    this.queue.push(callback);

    if (!this.isScriptAdded) {
      this.isScriptAdded = true;
      loadScript(() => {
        const callbacks = [...this.queue];
        this.queue = [];
        callbacks.forEach(cb => cb());
      });
    }
  }

  /**
   * Resets the loader state for testing purposes.
   */
  public reset(): void {
    this.queue = [];
    this.isScriptAdded = false;
  }
}
