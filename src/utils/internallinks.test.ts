import { describe, it, expect } from 'vitest';
import { extractWikilinks, resolveWikilink, validateWikilinks } from './internallinks';
import type { Post } from '@/types';

describe('internallinks wikilink parsing and resolution', () => {
  const mockPosts: Post[] = [
    {
      id: 'my-first-post',
      data: { title: 'My First Post' }
    },
    {
      id: 'folder-based-post',
      data: { title: 'Folder Based Post' }
    }
  ] as any[];

  describe('extractWikilinks', () => {
    it('should extract simple wikilinks', () => {
      const content = 'Check out [[My First Post]] here.';
      const matches = extractWikilinks(content);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        link: 'My First Post',
        display: 'My First Post',
        slug: 'my-first-post',
      });
    });

    it('should extract wikilinks with display text', () => {
      const content = 'Check out [[My First Post|first post link]].';
      const matches = extractWikilinks(content);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        link: 'My First Post',
        display: 'first post link',
        slug: 'my-first-post',
      });
    });

    it('should ignore image wikilinks', () => {
      const content = 'Here is an image ![[image.png]]';
      const matches = extractWikilinks(content);
      expect(matches).toHaveLength(0);
    });

    it('should ignore wikilinks inside code blocks and inline code', () => {
      const content = 'Code block:\n```\n[[My First Post]]\n```\nInline: `[[My First Post]]`';
      const matches = extractWikilinks(content);
      expect(matches).toHaveLength(0);
    });

    it('should correctly handle folder-based subpaths and index stripping', () => {
      const content = 'Folder-based: [[folder-based-post/index]]';
      const matches = extractWikilinks(content);
      expect(matches).toHaveLength(1);
      expect(matches[0].slug).toBe('folder-based-post');
    });

    it('should correctly handle absolute and relative paths with leading slashes or dots', () => {
      const content1 = 'Absolute: [[/dossier/the-project-pursue-reference-dossier/index|PURSUE documents are real]]';
      const matches1 = extractWikilinks(content1);
      expect(matches1).toHaveLength(1);
      expect(matches1[0].slug).toBe('the-project-pursue-reference-dossier');

      const content2 = 'Relative: [[../../dossier/the-project-pursue-reference-dossier/index|PURSUE documents are real]]';
      const matches2 = extractWikilinks(content2);
      expect(matches2).toHaveLength(1);
      expect(matches2[0].slug).toBe('the-project-pursue-reference-dossier');
    });
  });

  describe('resolveWikilink', () => {
    it('should resolve exact ID matches', () => {
      const resolved = resolveWikilink(mockPosts, 'my-first-post');
      expect(resolved).not.toBeNull();
      expect(resolved?.id).toBe('my-first-post');
    });

    it('should resolve title matches (case-insensitive and slugified)', () => {
      const resolved = resolveWikilink(mockPosts, 'My First Post');
      expect(resolved).not.toBeNull();
      expect(resolved?.id).toBe('my-first-post');
    });

    it('should return null if no post matches', () => {
      const resolved = resolveWikilink(mockPosts, 'Non Existent Post');
      expect(resolved).toBeNull();
    });
  });

  describe('validateWikilinks', () => {
    it('should categorize wikilinks into valid and invalid', () => {
      const content = 'Valid: [[My First Post]]. Invalid: [[Non Existent]].';
      const result = validateWikilinks(mockPosts, content);
      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].slug).toBe('my-first-post');
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].link).toBe('Non Existent');
    });
  });
});
