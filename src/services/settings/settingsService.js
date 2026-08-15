import Store from 'electron-store';
import fs from 'node:fs/promises';
import path from 'node:path';
import { defaultSettings } from '../../shared/defaultSettings.js';
import { mergeSettings, validateSettings } from '../../shared/validators.js';

export class SettingsService {
  constructor(app, logger) {
    this.app = app;
    this.logger = logger;
    this.baseDirectory = app.getPath('userData');
    this.backupPath = path.join(this.baseDirectory, 'settings.backup.json');
    this.store = new Store({
      name: 'settings',
      cwd: this.baseDirectory
    });
    this.settings = structuredClone(defaultSettings);
  }

  async init() {
    const storedSettings = this.store.get('settings', {});
    const backupSettings = await this.readBackup();
    this.settings = mergeSettings(Object.keys(storedSettings).length ? storedSettings : backupSettings);
    this.store.set('settings', this.settings);
    await this.writeBackup();
    await this.logger.info('Settings loaded');
  }

  get() {
    return structuredClone(this.settings);
  }

  update(patch) {
    this.settings = mergeSettings(patch, this.settings);
    this.settings = validateSettings(this.settings);
    this.persist();
    return this.get();
  }

  resetCategory(category) {
    if (!Object.hasOwn(defaultSettings, category)) throw new Error('Unknown settings category.');
    this.settings[category] = structuredClone(defaultSettings[category]);
    this.persist();
    return this.get();
  }

  resetAll() {
    this.settings = structuredClone(defaultSettings);
    this.persist();
    return this.get();
  }

  saveNow() {
    this.persist();
    return {
      settings: this.get(),
      settingsPath: this.store.path,
      backupPath: this.backupPath
    };
  }

  async exportTo(filePath) {
    await fs.writeFile(filePath, JSON.stringify(this.settings, null, 2), 'utf8');
    return { filePath };
  }

  async importFrom(filePath) {
    const imported = JSON.parse(await fs.readFile(filePath, 'utf8'));
    this.settings = mergeSettings(imported);
    this.persist();
    return this.get();
  }

  persist() {
    this.store.set('settings', this.settings);
    this.writeBackup().catch((error) => {
      this.logger.warn('Settings backup failed', { message: error.message });
    });
  }

  async readBackup() {
    try {
      return JSON.parse(await fs.readFile(this.backupPath, 'utf8'));
    } catch {
      return {};
    }
  }

  async writeBackup() {
    await fs.mkdir(this.baseDirectory, { recursive: true });
    await fs.writeFile(this.backupPath, JSON.stringify(this.settings, null, 2), 'utf8');
  }
}
