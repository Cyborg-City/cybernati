import { siteConfig } from '../config';

export function getBaseUrl(): string {
  // Parse base from siteConfig.site as the single source of truth
  try {
    const url = new URL(siteConfig.site);
    const base = url.pathname;
    const resolvedBase = base.endsWith('/') ? base : base + '/';
    // If siteConfig doesn't have a subpath but Vite says it does, fallback to Vite
    if (resolvedBase === '/' && typeof import.meta.env !== 'undefined' && import.meta.env.BASE_URL) {
      return import.meta.env.BASE_URL;
    }
    return resolvedBase;
  } catch {
    if (typeof import.meta.env !== 'undefined' && import.meta.env.BASE_URL) {
      return import.meta.env.BASE_URL;
    }
    return '/';
  }
}

export function resolveUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('mailto:') || path.startsWith('#')) {
    return path;
  }

  const base = getBaseUrl();
  
  // If base is just "/", normalize paths to start with a slash
  if (base === '/') {
    return path.startsWith('/') ? path : '/' + path;
  }

  const cleanBase = base.endsWith('/') ? base : base + '/'; // e.g. "/cybernati/"
  const baseWithoutTrailing = base.endsWith('/') ? base.slice(0, -1) : base; // e.g. "/cybernati"

  // Check if path already starts with the base URL (with or without trailing slash)
  if (path === baseWithoutTrailing || path === cleanBase || path.startsWith(cleanBase) || path.startsWith(baseWithoutTrailing + '/')) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanBase + cleanPath;
}
