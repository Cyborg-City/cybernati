import { describe, it, expect } from 'vitest';
import remarkInlineTags from './remark-inline-tags';

describe('remarkInlineTags', () => {
  it('should convert inline hashtags to standard link nodes', () => {
    const plugin = remarkInlineTags();
    const transformer = plugin as any;
    
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'Check out #another-tag here!'
            }
          ]
        }
      ]
    };
    
    const file = {
      path: 'src/content/posts/my-post.md'
    };
    
    transformer(tree, file);
    
    const paragraph = tree.children[0];
    expect(paragraph.children).toHaveLength(3);
    
    expect(paragraph.children[0]).toEqual({
      type: 'text',
      value: 'Check out '
    });
    
    // Check standard link node properties
    expect(paragraph.children[1].type).toBe('link');
    expect(paragraph.children[1].url).toBe('/cybernati/posts/tag/another-tag');
    expect(paragraph.children[1].children[0].value).toBe('#another-tag');
    expect(paragraph.children[1].data.hProperties.className).toContain('rounded-full');
    
    expect(paragraph.children[2]).toEqual({
      type: 'text',
      value: ' here!'
    });
  });
  
  it('should route to dossier tag for dossier files', () => {
    const plugin = remarkInlineTags();
    const transformer = plugin as any;
    
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See #dossier-tag.'
            }
          ]
        }
      ]
    };
    
    const file = {
      path: 'src/content/dossier/second-test-dossier/index.md'
    };
    
    transformer(tree, file);
    
    const paragraph = tree.children[0];
    expect(paragraph.children).toHaveLength(3);
    expect(paragraph.children[1].type).toBe('link');
    expect(paragraph.children[1].url).toBe('/cybernati/dossier/tag/dossier-tag');
  });

  it('should skip text nodes that are direct children of links', () => {
    const plugin = remarkInlineTags();
    const transformer = plugin as any;
    
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: '/some-other-link',
              children: [
                {
                  type: 'text',
                  value: '#already-a-link'
                }
              ]
            }
          ]
        }
      ]
    };
    
    const file = {
      path: 'src/content/posts/my-post.md'
    };
    
    transformer(tree, file);
    
    const paragraph = tree.children[0];
    expect(paragraph.children).toHaveLength(1);
    expect(paragraph.children[0].type).toBe('link');
    expect(paragraph.children[0].children[0].value).toBe('#already-a-link');
  });

  it('should convert inlineCode hashtags to standard link nodes preserving code style', () => {
    const plugin = remarkInlineTags();
    const transformer = plugin as any;
    
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'inlineCode',
              value: '#another-tag'
            }
          ]
        }
      ]
    };
    
    const file = {
      path: 'src/content/posts/my-post.md'
    };
    
    transformer(tree, file);
    
    const paragraph = tree.children[0];
    expect(paragraph.children).toHaveLength(1);
    expect(paragraph.children[0].type).toBe('link');
    expect(paragraph.children[0].url).toBe('/cybernati/posts/tag/another-tag');
    expect(paragraph.children[0].children[0].type).toBe('inlineCode');
    expect(paragraph.children[0].children[0].value).toBe('#another-tag');
  });
});
