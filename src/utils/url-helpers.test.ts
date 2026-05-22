import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveUrl, getBaseUrl } from './url-helpers';

vi.mock('../config', () => ({
  siteConfig: {
    site: 'https://cyborg-city.github.io/cybernati/',
  },
}));

describe('url-helpers', () => {
  beforeEach(() => {
    // Save original BASE_URL
    vi.stubEnv('BASE_URL', '/cybernati/');
    
    // Stub import.meta.env if needed or mock it
    if (typeof import.meta.env === 'undefined') {
      (globalThis as any).import = {
        meta: {
          env: {
            BASE_URL: '/cybernati/',
          }
        }
      };
    } else {
      // In vitest environment, we can directly set import.meta.env.BASE_URL
      import.meta.env.BASE_URL = '/cybernati/';
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should resolve base URL correctly', () => {
    expect(getBaseUrl()).toBe('/cybernati/');
  });

  it('should resolve relative paths correctly', () => {
    expect(resolveUrl('posts/my-post')).toBe('/cybernati/posts/my-post');
    expect(resolveUrl('/posts/my-post')).toBe('/cybernati/posts/my-post');
  });

  it('should ignore absolute or external urls', () => {
    expect(resolveUrl('https://google.com')).toBe('https://google.com');
    expect(resolveUrl('http://google.com')).toBe('http://google.com');
    expect(resolveUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(resolveUrl('#heading')).toBe('#heading');
  });

  it('should be idempotent and not double prefix paths', () => {
    expect(resolveUrl('/cybernati/posts/my-post')).toBe('/cybernati/posts/my-post');
    // If the path starts with the base without trailing slash, it should not be double prefixed
    expect(resolveUrl('/cybernati')).toBe('/cybernati');
    expect(resolveUrl('/cybernati/')).toBe('/cybernati/');
  });

  it('should fallback to config site path if import.meta.env is undefined', () => {
    // If we temporarily set BASE_URL to empty or undefined
    import.meta.env.BASE_URL = '';
    expect(getBaseUrl()).toBe('/cybernati/');
  });
});
