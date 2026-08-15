import { describe, expect, it } from 'vitest';
import { compareVersions, normalizeReleaseInfo, selectNewestReleaseByTag, selectUpdateAsset } from '../src/shared/updates.js';
import { validateTrustedReleaseUrl } from '../src/shared/validators.js';

describe('manual update helpers', () => {
  it('compares versions', () => {
    expect(compareVersions('2.0.0', '2.1.0')).toBe('update-available');
    expect(compareVersions('2.0.0', '2.0.0')).toBe('up-to-date');
    expect(compareVersions('2.1.0', '2.0.0')).toBe('ahead');
  });

  it('allows only trusted release URLs', () => {
    expect(validateTrustedReleaseUrl('https://github.com/FNBUBBLES420-ORG/Speech-to-Text-Application/releases/tag/v2.1.0')).toBe(
      true
    );
    expect(validateTrustedReleaseUrl('http://github.com/example')).toBe(false);
    expect(validateTrustedReleaseUrl('https://example.com/release')).toBe(false);
  });

  it('normalizes GitHub release payloads', () => {
    const info = normalizeReleaseInfo('2.0.0', {
      tag_name: 'v2.1.0',
      html_url: 'https://github.com/FNBUBBLES420-ORG/Speech-to-Text-Application/releases/tag/v2.1.0',
      published_at: '2026-08-15T00:00:00Z',
      body: 'Notes'
    });

    expect(info.status).toBe('update-available');
    expect(info.releaseUrl).toContain('github.com');
  });

  it('selects the newest release tag by version', () => {
    const newest = selectNewestReleaseByTag([
      { tag_name: 'v2.0.0', published_at: '2026-08-10T00:00:00Z' },
      { tag_name: 'v2.1.0', published_at: '2026-08-01T00:00:00Z' },
      { tag_name: 'v1.9.9', published_at: '2026-08-15T00:00:00Z' }
    ]);

    expect(newest.tag_name).toBe('v2.1.0');
  });

  it('prefers V201 Speech-to-Text release installers', () => {
    const asset = selectUpdateAsset([
      { name: 'notes.txt', browser_download_url: 'https://github.com/example/notes.txt' },
      { name: 'OtherSetup.exe', browser_download_url: 'https://github.com/example/OtherSetup.exe' },
      {
        name: 'V201-Speech-To-Text Setup.exe',
        browser_download_url: 'https://github.com/example/V201-Speech-To-Text%20Setup.exe',
        size: 100
      }
    ]);

    expect(asset.name).toBe('V201-Speech-To-Text Setup.exe');
  });
});
