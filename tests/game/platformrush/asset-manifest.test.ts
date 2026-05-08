/**
 * asset-manifest — bundle registration
 */
import { describe, it, expect } from 'vitest';
import { manifest } from '~/game/asset-manifest';

describe('asset-manifest — bundle registration', () => {
  const bundleNames = manifest.bundles.map(b => b.name);

  it('scene-platformrush bundle declared', () => {
    expect(bundleNames).toContain('scene-platformrush');
  });

  it('audio-sfx-platformrush bundle declared', () => {
    expect(bundleNames).toContain('audio-sfx-platformrush');
  });

  it('data-platformrush bundle declared', () => {
    expect(bundleNames).toContain('data-platformrush');
  });

  it('all bundle names match ^[a-z][a-z0-9-]*$', () => {
    const pattern = /^[a-z][a-z0-9-]*$/;
    for (const name of bundleNames) {
      expect(name, `Bundle "${name}" has invalid characters`).toMatch(pattern);
    }
  });

  it('fx-platformrush bundle declared', () => {
    expect(bundleNames).toContain('fx-platformrush');
  });

  it('audio-music-platformrush bundle declared', () => {
    expect(bundleNames).toContain('audio-music-platformrush');
  });
});
