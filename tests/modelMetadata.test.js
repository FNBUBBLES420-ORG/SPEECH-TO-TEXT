import { describe, expect, it } from 'vitest';
import { MODEL_CATALOG } from '../src/shared/constants.js';

describe('model metadata', () => {
  it('contains safe model file metadata', () => {
    expect(MODEL_CATALOG.length).toBeGreaterThan(1);
    for (const model of MODEL_CATALOG) {
      expect(model.fileName.endsWith('.bin')).toBe(true);
      expect(model.url.startsWith('https://huggingface.co/')).toBe(true);
      expect(model.bytes).toBeGreaterThan(0);
    }
  });
});
