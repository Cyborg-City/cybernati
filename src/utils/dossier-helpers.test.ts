import { describe, it, expect, vi } from 'vitest';

// Mock astro:content before importing anything that uses it
vi.mock('astro:content', () => ({
  render: vi.fn(),
  getCollection: vi.fn(),
}));

import { sortPostsByDate, shouldShowContent, extractTags } from './markdown';

describe('Dossier Helper Utilities', () => {
  const mockDossiers = [
    {
      id: 'dossier-1',
      data: {
        title: 'Classified Report Alpha',
        date: new Date('2026-05-20'),
        tags: ['classified', 'alpha'],
        draft: false,
      },
    },
    {
      id: 'dossier-2',
      data: {
        title: 'Classified Report Beta',
        date: new Date('2026-05-22'),
        tags: ['classified', 'beta'],
        draft: true,
      },
    },
    {
      id: 'dossier-3',
      data: {
        title: 'Classified Report Gamma',
        date: new Date('2026-05-18'),
        tags: ['gamma', 'alpha'],
        draft: false,
      },
    },
  ];

  describe('sortPostsByDate (Generic Sorting)', () => {
    it('should sort dossiers by date in descending order (newest first)', () => {
      const sorted = sortPostsByDate([...mockDossiers] as any);
      expect(sorted[0].id).toBe('dossier-2'); // 2026-05-22
      expect(sorted[1].id).toBe('dossier-1'); // 2026-05-20
      expect(sorted[2].id).toBe('dossier-3'); // 2026-05-18
    });
  });

  describe('shouldShowContent (Draft Filtering)', () => {
    it('should show all content in dev mode (isDev = true)', () => {
      const showDraft = shouldShowContent(mockDossiers[1] as any, true);
      expect(showDraft).toBe(true);
    });

    it('should hide draft content in production mode (isDev = false)', () => {
      const showDraft = shouldShowContent(mockDossiers[1] as any, false);
      expect(showDraft).toBe(false);
    });

    it('should show non-draft content in production mode', () => {
      const showActive = shouldShowContent(mockDossiers[0] as any, false);
      expect(showActive).toBe(true);
    });
  });

  describe('extractTags', () => {
    it('should extract all unique tags alphabetically', () => {
      const tags = extractTags(mockDossiers as any);
      expect(tags).toEqual(['alpha', 'beta', 'classified', 'gamma']);
    });

    it('should return empty array if no tags exist', () => {
      const noTags = [
        {
          id: 'dossier-none',
          data: { title: 'No Tags', date: new Date() },
        },
      ];
      expect(extractTags(noTags as any)).toEqual([]);
    });
  });
});
