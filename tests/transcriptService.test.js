import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { TranscriptService } from '../src/services/storage/transcriptService.js';

describe('transcript storage', () => {
  it('saves, lists, renames, and deletes transcripts outside the repo', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'stt-transcripts-'));
    const app = { getPath: () => root };
    const service = new TranscriptService(app, { info: async () => {} });
    await service.init();

    const saved = await service.save({
      title: 'Class notes',
      segments: [{ text: 'hello', startMs: 0, endMs: 500 }]
    });
    expect((await service.list())[0].title).toBe('Class notes');

    await service.rename(saved.id, 'Renamed');
    expect((await service.list())[0].title).toBe('Renamed');

    await service.delete(saved.id);
    expect(await service.list()).toHaveLength(0);
  });
});
