import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateUserWritablePath } from '../src/shared/validators.js';

describe('path validation', () => {
  it('accepts app data and user profile paths', () => {
    const appData = path.resolve('C:/Users/frost/AppData/Roaming/SpeechToText');
    expect(validateUserWritablePath(path.join(appData, 'exports', 'a.txt'), appData)).toBe(true);
  });

  it('rejects empty paths', () => {
    expect(validateUserWritablePath('', 'C:/Users/frost/AppData/Roaming/SpeechToText')).toBe(false);
  });
});
