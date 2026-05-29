import { describe, it, expect } from 'vitest';
import { getRelatedLinkHref, getRelatedLinkClass, generateRelatedLinksHTML } from './player-links';

describe('Player Links Utility (TDD)', () => {
  describe('getRelatedLinkHref', () => {
    it('returns original slug if it does not start with slash', () => {
      expect(getRelatedLinkHref('posts/my-post', '/')).toBe('posts/my-post');
    });

    it('prepends base if slug starts with slash and is not already prefixed', () => {
      expect(getRelatedLinkHref('/posts/my-post', '/cybernati/')).toBe('/cybernati/posts/my-post');
    });

    it('does not double prefix if already prefixed', () => {
      expect(getRelatedLinkHref('/cybernati/posts/my-post', '/cybernati/')).toBe('/cybernati/posts/my-post');
    });
  });

  describe('getRelatedLinkClass', () => {
    it('returns pip class when isPip is true', () => {
      expect(getRelatedLinkClass(true)).toBe('cyber-pip-related-link');
    });

    it('returns standard class when isPip is false', () => {
      expect(getRelatedLinkClass(false)).toBe('cyber-related-link');
    });
  });

  describe('generateRelatedLinksHTML', () => {
    it('returns empty string if no related links exist', () => {
      expect(generateRelatedLinksHTML([], '/', false)).toBe('');
    });

    it('renders HTML anchors for list of links', () => {
      const links = [
        { name: 'Link 1', slug: 'posts/link-1' }
      ];
      const html = generateRelatedLinksHTML(links, '/', false);
      expect(html).toContain('href="posts/link-1"');
      expect(html).toContain('Link 1');
      expect(html).toContain('cyber-related-link');
    });
  });
});
