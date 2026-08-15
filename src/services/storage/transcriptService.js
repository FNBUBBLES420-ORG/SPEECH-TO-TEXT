import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export class TranscriptService {
  constructor(app, logger) {
    this.baseDirectory = path.join(app.getPath('userData'), 'transcripts');
    this.indexPath = path.join(this.baseDirectory, 'index.json');
    this.logger = logger;
  }

  async init() {
    await fs.mkdir(this.baseDirectory, { recursive: true });
    try {
      await fs.access(this.indexPath);
    } catch {
      await fs.writeFile(this.indexPath, '[]', 'utf8');
    }
  }

  async list() {
    return this.readIndex();
  }

  async save(transcript) {
    const now = new Date().toISOString();
    const id = transcript.id || crypto.randomUUID();
    const metadata = {
      id,
      title: transcript.title || `Transcript ${new Date().toLocaleString()}`,
      date: transcript.date || now.slice(0, 10),
      startTime: transcript.startTime || now,
      durationMs: Number(transcript.durationMs || 0),
      language: transcript.language || 'auto',
      model: transcript.model || 'unknown',
      createdAt: transcript.createdAt || now,
      updatedAt: now
    };
    const full = { ...metadata, segments: transcript.segments || [], text: transcript.text || '' };
    await fs.writeFile(this.filePath(id), JSON.stringify(full, null, 2), 'utf8');
    const index = (await this.readIndex()).filter((item) => item.id !== id);
    index.unshift(metadata);
    await this.writeIndex(index);
    return full;
  }

  async get(id) {
    return JSON.parse(await fs.readFile(this.filePath(id), 'utf8'));
  }

  async rename(id, title) {
    const transcript = await this.get(id);
    transcript.title = title.trim() || transcript.title;
    return this.save(transcript);
  }

  async delete(id) {
    await fs.rm(this.filePath(id), { force: true });
    await this.writeIndex((await this.readIndex()).filter((item) => item.id !== id));
    return true;
  }

  async clear() {
    await fs.rm(this.baseDirectory, { recursive: true, force: true });
    await this.init();
    return true;
  }

  filePath(id) {
    const safeId = String(id).replace(/[^a-zA-Z0-9-]/g, '');
    return path.join(this.baseDirectory, `${safeId}.json`);
  }

  async readIndex() {
    try {
      return JSON.parse(await fs.readFile(this.indexPath, 'utf8'));
    } catch {
      return [];
    }
  }

  async writeIndex(index) {
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf8');
  }
}
