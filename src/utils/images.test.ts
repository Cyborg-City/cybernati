import { describe, it, expect } from 'vitest';
import { resolveCoverImage } from './images';

describe('resolveCoverImage', () => {
  it('should resolve a bare cover image filename for a folder-based content entry', () => {
    const result = resolveCoverImage(
      'depiction.png',
      'vault',
      'the-aurora-incident'
    );
    expect(result).toEqual({
      src: 'depiction.webp',
      basePath: '/vault/the-aurora-incident/'
    });
  });

  it('should strip Obsidian brackets and resolve file-based shared attachments folder cover image', () => {
    const result = resolveCoverImage(
      '[[attachments/cover-photo.jpg]]',
      'posts',
      'my-first-post'
    );
    expect(result).toEqual({
      src: 'cover-photo.webp',
      basePath: '/posts/attachments/'
    });
  });

  it('should return the image path as-is and empty basePath for external HTTP/HTTPS URLs', () => {
    const result = resolveCoverImage(
      'https://images.unsplash.com/photo-12345?auto=format',
      'projects'
    );
    expect(result).toEqual({
      src: 'https://images.unsplash.com/photo-12345?auto=format',
      basePath: ''
    });
  });

  it('should handle subfolder prefixes like images/ inside folder-based entries', () => {
    const result = resolveCoverImage(
      'images/screenshot.png',
      'dossier',
      'the-dossier'
    );
    expect(result).toEqual({
      src: 'screenshot.webp',
      basePath: '/dossier/the-dossier/'
    });
  });

  it('should gracefully handle empty or null image values with empty results', () => {
    expect(resolveCoverImage('', 'posts')).toEqual({ src: '', basePath: '' });
    expect(resolveCoverImage(null as any, 'posts')).toEqual({ src: '', basePath: '' });
    expect(resolveCoverImage(undefined as any, 'posts')).toEqual({ src: '', basePath: '' });
  });

  it('should handle unquoted YAML array inputs by resolving the first element', () => {
    const result = resolveCoverImage(
      ['first-image.png', 'second-image.png'],
      'vault',
      'my-dossier-entry'
    );
    expect(result).toEqual({
      src: 'first-image.webp',
      basePath: '/vault/my-dossier-entry/'
    });
  });
});
