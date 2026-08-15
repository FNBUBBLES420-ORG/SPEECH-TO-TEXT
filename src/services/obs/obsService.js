import fs from 'node:fs/promises';

export class ObsService {
  constructor(settings, logger) {
    this.settings = settings;
    this.logger = logger;
    this.listening = false;
  }

  getState() {
    return { listening: this.listening };
  }

  setListening(value) {
    this.listening = Boolean(value);
  }

  async writeCaptionText(text) {
    const obsSettings = this.settings.get().obs;
    if (!obsSettings.enabled || !obsSettings.outputPath) return false;
    const tempPath = `${obsSettings.outputPath}.tmp`;
    await fs.writeFile(tempPath, text, 'utf8');
    await fs.rename(tempPath, obsSettings.outputPath);
    return true;
  }
}
