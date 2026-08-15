import semver from 'semver';
import { validateTrustedReleaseUrl } from './validators.js';

const preferredInstallerName = /^V201-Speech-To-Text.*\.(exe|msi)$/i;
const fallbackInstallerName = /\.(exe|msi)$/i;

export function compareVersions(currentVersion, latestVersion) {
  const current = semver.coerce(currentVersion);
  const latest = semver.coerce(latestVersion);
  if (!current || !latest) return 'unknown';
  if (semver.lt(current, latest)) return 'update-available';
  if (semver.eq(current, latest)) return 'up-to-date';
  return 'ahead';
}

export function normalizeReleaseInfo(currentVersion, release) {
  const latestVersion = release?.tag_name || release?.name || '';
  const htmlUrl = release?.html_url || '';
  const updateAsset = selectUpdateAsset(release?.assets || []);
  return {
    currentVersion,
    latestVersion,
    releaseDate: release?.published_at || '',
    releaseNotes: release?.body || '',
    releaseUrl: validateTrustedReleaseUrl(htmlUrl) ? htmlUrl : '',
    updateAsset,
    status: compareVersions(currentVersion, latestVersion)
  };
}

export function selectUpdateAsset(assets = []) {
  const installers = assets
    .filter((asset) => asset?.name && asset?.browser_download_url)
    .filter((asset) => fallbackInstallerName.test(asset.name));
  const preferred = installers.find((asset) => preferredInstallerName.test(asset.name));
  const selected = preferred || installers[0];
  if (!selected) return null;
  return {
    id: selected.id,
    name: selected.name,
    size: selected.size || 0,
    downloadUrl: selected.browser_download_url,
    contentType: selected.content_type || ''
  };
}

export function selectNewestReleaseByTag(releases = []) {
  const published = releases.filter((release) => release && !release.draft && release.tag_name);
  const withVersions = published
    .map((release) => ({ release, version: semver.coerce(release.tag_name) }))
    .filter((item) => item.version);
  if (withVersions.length) {
    return withVersions.sort((a, b) => semver.rcompare(a.version, b.version))[0].release;
  }
  return published.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))[0] || null;
}
