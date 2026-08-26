import { GITHUB_RELEASES_API_URL } from '../../shared/constants.js';
import { selectNewestReleaseByTag } from '../../shared/updates.js';

export async function fetchLatestRelease() {
  const response = await fetch(`${GITHUB_RELEASES_API_URL}?per_page=100`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Speech-to-Text-Application'
    }
  });
  assertReleaseResponse(response);
  const releases = await response.json();
  const newest = selectNewestReleaseByTag(releases);
  if (!newest) throw new Error('No published releases were found for the official update source yet.');
  return newest;
}

export async function fetchReleaseByTag(tagName) {
  const safeTag = encodeURIComponent(tagName);
  const response = await fetch(`${GITHUB_RELEASES_API_URL}/tags/${safeTag}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Speech-to-Text-Application'
    }
  });
  assertReleaseResponse(response);
  return response.json();
}

function assertReleaseResponse(response) {
  if (response.ok) return;
  if (response.status === 404) {
    throw new Error('No public releases were found. Make the GitHub release public, or publish releases from a public repository.');
  }
  if (response.status === 403) {
    throw new Error('GitHub rate limited the update check. Try again later.');
  }
  throw new Error('Could not reach the official release source.');
}
