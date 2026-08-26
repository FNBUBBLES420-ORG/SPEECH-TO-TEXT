import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { MODEL_CATALOG } from '../../shared/constants.js';

export class ModelService {
  constructor(app, logger) {
    this.baseDirectory = path.join(app.getPath('userData'), 'models');
    this.logger = logger;
    this.controllers = new Map();
  }

  async init() {
    await fs.mkdir(this.baseDirectory, { recursive: true });
  }

  async list() {
    return Promise.all(
      MODEL_CATALOG.map(async (model) => ({
        ...model,
        path: this.pathFor(model),
        installed: await exists(this.pathFor(model)),
        downloadStatus: this.controllers.has(model.id) ? 'downloading' : 'idle'
      }))
    );
  }

  async download(id, mainWindow) {
    const model = MODEL_CATALOG.find((item) => item.id === id);
    if (!model) throw new Error('Unknown model.');
    if (this.controllers.has(id)) return { started: false, reason: 'already-downloading' };

    const controller = new AbortController();
    this.controllers.set(id, controller);
    const target = this.pathFor(model);
    const temp = `${target}.download`;

    try {
      const response = await fetch(model.url, { signal: controller.signal });
      if (!response.ok || !response.body) throw new Error('Model download failed.');
      const total = Number(response.headers.get('content-length') || model.bytes || 0);
      let received = 0;
      const file = fsSync.createWriteStream(temp);
      for await (const chunk of response.body) {
        received += chunk.length;
        file.write(chunk);
        mainWindow.webContents.send('models:progress', { id, received, total });
      }
      await new Promise((resolve, reject) => {
        file.end(resolve);
        file.on('error', reject);
      });
      const stats = await fs.stat(temp);
      if (model.bytes && stats.size < model.bytes * 0.85) {
        throw new Error('Downloaded model did not pass size verification.');
      }
      await fs.rename(temp, target);
      await this.logger.info('Model downloaded', { id });
      return { started: true, installed: true };
    } catch (error) {
      await fs.rm(temp, { force: true });
      if (error.name === 'AbortError') return { started: true, canceled: true };
      await this.logger.error('Model download failed', { id, message: error.message });
      throw error;
    } finally {
      this.controllers.delete(id);
    }
  }

  cancel(id) {
    this.controllers.get(id)?.abort();
    this.controllers.delete(id);
    return true;
  }

  async remove(id) {
    const model = MODEL_CATALOG.find((item) => item.id === id);
    if (!model) throw new Error('Unknown model.');
    await fs.rm(this.pathFor(model), { force: true });
    return true;
  }

  async clear() {
    await fs.rm(this.baseDirectory, { recursive: true, force: true });
    await this.init();
    return true;
  }

  pathFor(model) {
    return path.join(this.baseDirectory, model.fileName);
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
