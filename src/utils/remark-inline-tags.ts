import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text } from 'mdast';
import { resolveUrl } from './url-helpers.ts';

/**
 * Remark plugin for processing inline Obsidian tags
 * 
 * Converts inline tags like #quick-start and `#quick-start` into clickable pill-style links
 * that match the theme's tag styling.
 * 
 * Pattern: #tag-name (must start with #, followed by alphanumeric, hyphens, underscores)
 * Tags are matched when they appear at word boundaries (start of text, after whitespace, or after punctuation)
 */

const remarkInlineTags: Plugin<[], Root> = () => {
  return (tree, file) => {
    // Determine the current collection dynamically based on the file path
    // Default to 'posts' if we can't determine it
    let collection = 'posts';
    if (file && file.path) {
      const normalizedPath = String(file.path).replace(/\\/g, "/");
      const pathParts = normalizedPath.split("/");
      const contentIndex = pathParts.lastIndexOf("content");
      
      // If the file is inside src/content/FOLDER/..., the collection is FOLDER
      if (contentIndex !== -1 && contentIndex + 1 < pathParts.length) {
        collection = pathParts[contentIndex + 1];
      }
    }

    visit(tree, ['text', 'inlineCode'], (node: any, index, parent: any) => {
      if (!parent || typeof index !== 'number') return;
      
      // Skip text/code nodes that are already children of links
      if (parent.type === 'link') return;
      
      // Handle inlineCode tags (e.g. `#tag`)
      if (node.type === 'inlineCode') {
        const value = node.value.trim();
        const inlineTagPattern = /^#([\w-]+)$/;
        const match = inlineTagPattern.exec(value);
        if (match) {
          const tag = match[1];
          const tagLink = {
            type: 'link',
            url: resolveUrl(`/${collection}/tag/${encodeURIComponent(tag)}`),
            children: [
              {
                type: 'inlineCode',
                value: `#${tag}`
              }
            ],
            data: {
              hProperties: {
                className: [
                  'text-xs', 'text-primary-600', 'dark:text-primary-300',
                  'bg-primary-100', 'dark:bg-primary-800', 'px-2.5', 'py-1',
                  'rounded-full', 'border', 'border-primary-200',
                  'dark:border-primary-700', 'transition-colors',
                  'hover:bg-highlight-100', 'dark:hover:bg-highlight-800'
                ]
              }
            }
          };
          parent.children.splice(index, 1, tagLink);
        }
        return;
      }
      
      // Handle standard text tags (e.g. #tag)
      const text = node.value;
      // Match #tag-name pattern
      // Tag must start with #, followed by word characters, hyphens, or underscores
      // Must be at word boundary (start of string, after whitespace, or after punctuation)
      const tagPattern = /(?:^|[\s\p{P}])#([\w-]+)/gu;
      const matches: Array<{ tag: string; start: number; end: number; hasPrefix: boolean }> = [];
      
      let match;
      while ((match = tagPattern.exec(text)) !== null) {
        const tag = match[1];
        const fullMatch = match[0]; // Includes the # and any preceding character
        const hasPrefix = fullMatch.length > tag.length + 1; // Has a character before #
        const start = match.index + (hasPrefix ? 1 : 0); // Skip prefix char if present
        const end = start + tag.length + 1; // +1 for the #
        
        matches.push({
          tag,
          start,
          end,
          hasPrefix
        });
      }
      
      // If no matches, continue
      if (matches.length === 0) return;
      
      // Build new children array with text nodes and standard link nodes for tags
      const newChildren: any[] = [];
      let lastIndex = 0;
      
      matches.forEach(({ tag, start, end, hasPrefix }) => {
        // Add text before the tag (including any prefix character)
        if (start > lastIndex) {
          const beforeText = text.slice(lastIndex, start);
          if (beforeText) {
            newChildren.push({
              type: 'text',
              value: beforeText
            });
          }
        }
        
        // Create standard link node for the tag link
        const tagLink = {
          type: 'link',
          url: resolveUrl(`/${collection}/tag/${encodeURIComponent(tag)}`),
          children: [
            {
              type: 'text',
              value: `#${tag}`
            }
          ],
          data: {
            hProperties: {
              className: [
                'text-xs', 'text-primary-600', 'dark:text-primary-300',
                'bg-primary-100', 'dark:bg-primary-800', 'px-2.5', 'py-1',
                'rounded-full', 'border', 'border-primary-200',
                'dark:border-primary-700', 'transition-colors',
                'hover:bg-highlight-100', 'dark:hover:bg-highlight-800'
              ]
            }
          }
        };
        
        newChildren.push(tagLink);
        lastIndex = end;
      });
      
      // Add remaining text after the last tag
      if (lastIndex < text.length) {
        const afterText = text.slice(lastIndex);
        if (afterText) {
          newChildren.push({
            type: 'text',
            value: afterText
          });
        }
      }
      
      // Replace the text node with the new children
      if (newChildren.length > 0) {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
};

export default remarkInlineTags;
