import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SettingsService } from '../src/services/settings/settingsService.js';

const logger = {
  info: async () => {},
  warn: async () => {}
};

describe('settings save state', () => {
  it('backs up settings and restores them on the next app run', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'stt-settings-'));
    const app = { getPath: () => root };
    const first = new SettingsService(app, logger);
    await first.init();
    first.update({ appearance: { theme: 'light' }, transcription: { defaultModel: 'tiny' } });
    const saved = first.saveNow();

    expect(saved.backupPath.endsWith('settings.backup.json')).toBe(true);

    const second = new SettingsService(app, logger);
    await second.init();
    expect(second.get().appearance.theme).toBe('light');
    expect(second.get().transcription.defaultModel).toBe('tiny');
  });

  it('exports and imports settings backup files', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'stt-settings-import-'));
    const app = { getPath: () => root };
    const service = new SettingsService(app, logger);
    await service.init();
    service.update({ accessibility: { transcriptFontSize: 28 } });

    const exportPath = path.join(root, 'backup.json');
    await service.exportTo(exportPath);

    const imported = new SettingsService(app, logger);
    await imported.init();
    imported.resetAll();
    await imported.importFrom(exportPath);

    expect(imported.get().accessibility.transcriptFontSize).toBe(28);
  });
});
