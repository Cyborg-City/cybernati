/**
 * TSDoc: Player UI Helper Functions
 * 
 * WHY: Provides robust, shared DOM manipulation helpers for opening and closing
 * slide-out panels (Related Notes, Share, Playlist/Queue panels). Centering this logic here
 * ensures class names remain consistent, eliminates copy-paste clutter, and enables TDD testing
 * of DOM classes transition logic.
 */

/**
 * WHY: Opens a slide-out panel by removing closed utility classes (max-h-0, opacity-0)
 * and adding open utility classes (max-h-[300px], opacity-100).
 */
export function openPanel(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.remove('max-h-0', 'opacity-0');
  el.classList.add('max-h-[300px]', 'opacity-100');
}

/**
 * WHY: Closes a slide-out panel by adding closed utility classes (max-h-0, opacity-0)
 * and removing open utility classes (max-h-[300px], opacity-100).
 */
export function closePanel(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.add('max-h-0', 'opacity-0');
  el.classList.remove('max-h-[300px]', 'opacity-100');
}

/**
 * WHY: Suppresses CSS transitions during DOM re-parenting operations (e.g. slot → PiP, PiP → slot, docking, closing)
 * to prevent visual layout flash. The intentional offsetHeight read forces a synchronous
 * layout reflow so all position/size changes are applied atomically before transitions resume.
 */
export function withNoTransition(el: HTMLElement | null, fn: () => void): void {
  if (!el) {
    fn();
    return;
  }
  el.classList.add('no-transition');
  fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  el.offsetHeight; // intentional synchronous layout reflow to apply styling immediately
  el.classList.remove('no-transition');
}
