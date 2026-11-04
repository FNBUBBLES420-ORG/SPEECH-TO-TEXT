import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertString,
  isInsideDirectory,
  validateIpcPayload,
  validateUserWritablePath
} from '../src/shared/validators.js';

describe('IPC input validation', () => {
  it('keeps only allowed payload keys', () => {
    expect(validateIpcPayload({ id: '1', title: 'A', path: '../secret' }, ['id', 'title'])).toEqual({
      id: '1',
      title: 'A'
    });
  });

  it('rejects non-string and oversized string values', () => {
    expect(() => assertString(42, 'Title')).toThrow(/text/);
    expect(() => assertString('x'.repeat(10), 'Title', 3)).toThrow(/too long/);
  });

  it('uses directory containment instead of prefix matching', () => {
    const parent = path.resolve('C:/Users/frost/AppData/Roaming/App');
    const sibling = path.resolve('C:/Users/frost/AppData/Roaming/App-other/file.txt');
    expect(isInsideDirectory(sibling, parent)).toBe(false);
  });

  it('allows selected user profile export paths', () => {
    const userProfile = process.env.USERPROFILE || process.env.HOME;
    const exportPath = path.join(userProfile, 'Documents', 'captions.txt');
    const appDataPath = path.join(userProfile, 'AppData', 'App');
    expect(validateUserWritablePath(exportPath, appDataPath)).toBe(true);
  });
});
