/**
 * TSDoc: Player Related Links Utility
 * 
 * WHY: Provides robust, pure functional helpers for formatting related links URLs
 * and class styling. Isolating this from direct DOM operations ensures we can thoroughly unit test
 * standard-vs-pip related link styling and prevent link-drift bugs on the site.
 */

export interface RelatedLink {
  name: string;
  slug: string;
}

/**
 * WHY: Formats the related link URL slug correctly relative to the platform's subfolder base path.
 */
export function getRelatedLinkHref(slug: string, base: string): string {
  if (slug.startsWith('/') && !slug.startsWith(base)) {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return cleanBase + slug;
  }
  return slug;
}

/**
 * WHY: Returns the correct class styling for standard vs compact PiP related links.
 */
export function getRelatedLinkClass(isPip: boolean): string {
  return isPip ? 'cyber-pip-related-link' : 'cyber-related-link';
}

/**
 * WHY: Returns the formatted HTML anchors for a collection of related links.
 */
export function generateRelatedLinksHTML(related: RelatedLink[] | undefined, base: string, isPip: boolean): string {
  if (!related || related.length === 0) return '';
  
  return related.map(link => {
    const href = getRelatedLinkHref(link.slug, base);
    const paddingClass = isPip ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
    const linkClass = getRelatedLinkClass(isPip);
    
    return `<a href="${href}" class="${linkClass} ${paddingClass} rounded font-medium border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-highlight-500 hover:text-highlight-300 transition duration-150" style="font-family: var(--font-prose), sans-serif;">${link.name}</a>`;
  }).join('');
}
