import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertString,
  isInsideDirectory,
  validateIpcPayload,
  validateUserWritablePath
} from '../src/shared/validators.js';

describe('IPC input validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
    vi.stubEnv('USERPROFILE', 'C:/Users/frost');
    vi.stubEnv('HOME', 'C:/Users/frost');
    expect(validateUserWritablePath('C:/Users/frost/Documents/captions.txt', 'C:/Users/frost/AppData/App')).toBe(
      true
    );
  });
});
