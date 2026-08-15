import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

describe('renderer asset references', () => {
  it('loads the audio worklet from an existing renderer path', () => {
    const appScript = fs.readFileSync(path.join(projectRoot, 'src/renderer/scripts/app.js'), 'utf8');
    const match = appScript.match(/audioWorklet\.addModule\('([^']+)'\)/u);

    expect(match?.[1]).toBeTruthy();
    expect(fs.existsSync(path.join(projectRoot, 'src/renderer', match[1]))).toBe(true);
  });
});
