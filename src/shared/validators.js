import path from 'node:path';
import { TRUSTED_RELEASE_HOSTS } from './constants.js';
import { defaultSettings } from './defaultSettings.js';

const allowedThemes = new Set(['system', 'dark', 'light']);
const allowedCloseBehaviors = new Set(['tray', 'exit']);
const allowedAlignments = new Set(['left', 'center', 'right']);

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function mergeSettings(input, defaults = defaultSettings) {
  if (!isPlainObject(input)) return structuredClone(defaults);
  const output = structuredClone(defaults);

  for (const [category, values] of Object.entries(input)) {
    if (!isPlainObject(values) || !isPlainObject(output[category])) continue;
    output[category] = { ...output[category], ...values };
    if (category === 'obs' && isPlainObject(values.captionWindow)) {
      output.obs.captionWindow = {
        ...defaults.obs.captionWindow,
        ...values.captionWindow
      };
    }
  }

  return validateSettings(output);
}

export function validateSettings(settings) {
  const next = structuredClone(settings);
  if (!allowedThemes.has(next.appearance.theme)) next.appearance.theme = defaultSettings.appearance.theme;
  next.appearance.interfaceScale = clampNumber(next.appearance.interfaceScale, 0.85, 1.3, 1);
  next.accessibility.transcriptFontSize = clampNumber(
    next.accessibility.transcriptFontSize,
    14,
    34,
    18
  );
  next.accessibility.captionFontSize = clampNumber(next.accessibility.captionFontSize, 18, 80, 32);
  next.audio.sensitivity = clampNumber(next.audio.sensitivity, 0, 1, 0.45);
  next.transcription.vadThreshold = clampNumber(next.transcription.vadThreshold, 0, 1, 0.02);
  if (!allowedCloseBehaviors.has(next.general.closeBehavior)) next.general.closeBehavior = 'exit';
  if (!next.general.trayEnabled && next.general.closeBehavior === 'tray') next.general.closeBehavior = 'exit';
  if (!allowedAlignments.has(next.obs.captionWindow.alignment)) next.obs.captionWindow.alignment = 'center';
  next.obs.captionWindow.opacity = clampNumber(next.obs.captionWindow.opacity, 0.1, 1, 0.72);
  next.obs.captionWindow.maxLines = Math.round(clampNumber(next.obs.captionWindow.maxLines, 1, 8, 3));
  return next;
}

export function validateIpcPayload(payload, allowedKeys) {
  if (!isPlainObject(payload)) return {};
  return Object.fromEntries(Object.entries(payload).filter(([key]) => allowedKeys.includes(key)));
}

export function validateUserWritablePath(filePath, appDataPath) {
  if (typeof filePath !== 'string' || !filePath.trim()) return false;
  const resolved = path.resolve(filePath);
  const appData = path.resolve(appDataPath);
  const home = path.resolve(process.env.USERPROFILE || process.env.HOME || appData);
  return isInsideDirectory(resolved, appData) || isInsideDirectory(resolved, home);
}

export function validateTrustedReleaseUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && TRUSTED_RELEASE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function assertString(value, fieldName, maxLength = 500) {
  if (typeof value !== 'string') throw new Error(`${fieldName} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new Error(`${fieldName} is too long.`);
  return trimmed;
}

export function isInsideDirectory(targetPath, parentPath) {
  const relative = path.relative(parentPath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
