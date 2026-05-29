import { describe, it, expect } from 'vitest';
import {
  generateNodeId,
  extractWikilinks,
  extractStandardLinks
} from '../../scripts/generate-graph-data.js';

describe('Graph Data Generation — generateNodeId', () => {
  it('should resolve same-collection paths correctly', () => {
    const result = generateNodeId('posts/my-first-post', 'posts');
    expect(result).toBe('my-first-post');
  });

  it('should strip collection prefixes for cross-collection paths', () => {
    const result = generateNodeId('dossier/the-project-pursue-reference-dossier', 'posts');
    expect(result).toBe('the-project-pursue-reference-dossier');
  });

  it('should handle index and .md extensions properly', () => {
    const result = generateNodeId('src/content/dossier/my-dossier/index.md', 'dossier');
    expect(result).toBe('my-dossier');
  });

  it('should clean special characters and spaces correctly', () => {
    const result = generateNodeId('dossier/The Project — PURSUE Dossier', 'posts');
    expect(result).toBe('the-project-pursue-dossier');
  });

  it('should handle leading slashes gracefully', () => {
    const result = generateNodeId('/dossier/my-vault-entry', 'posts');
    expect(result).toBe('my-vault-entry');
  });
});

describe('Graph Data Generation — extractWikilinks', () => {
  it('should parse same-collection wikilinks', () => {
    const content = 'Check out [[My First Post]] here.';
    const matches = extractWikilinks(content);
    expect(matches).toHaveLength(1);
    expect(matches[0].slug).toBe('my-first-post');
  });

  it('should parse cross-collection wikilinks and resolve target ID without collection prefix', () => {
    const content = 'Check out [[dossier/the-project-pursue-reference-dossier|PURSUE dossier]] here.';
    const matches = extractWikilinks(content);
    expect(matches).toHaveLength(1);
    expect(matches[0].slug).toBe('the-project-pursue-reference-dossier');
  });
});

describe('Graph Data Generation — extractStandardLinks', () => {
  it('should parse cross-collection markdown links correctly', () => {
    const content = 'Check out [PURSUE documents](dossier/the-project-pursue-reference-dossier.md) here.';
    const matches = extractStandardLinks(content);
    expect(matches).toHaveLength(1);
    expect(matches[0].slug).toBe('the-project-pursue-reference-dossier');
  });

  it('should parse absolute path cross-collection markdown links correctly', () => {
    const content = 'Check out [PURSUE documents](/dossier/the-project-pursue-reference-dossier) here.';
    const matches = extractStandardLinks(content);
    expect(matches).toHaveLength(1);
    expect(matches[0].slug).toBe('the-project-pursue-reference-dossier');
  });
});
