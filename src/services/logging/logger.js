import fs from 'node:fs/promises';
import path from 'node:path';

export function createLogger(app) {
  const logDirectory = app.getPath('logs');
  const logFile = path.join(logDirectory, 'application.log');

  async function write(level, message, meta = {}) {
    await fs.mkdir(logDirectory, { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      level,
      message,
      meta: sanitizeMeta(meta)
    };
    await fs.appendFile(logFile, `${JSON.stringify(entry)}\n`, 'utf8').catch(() => {});
  }

  return {
    logDirectory,
    async init() {
      await fs.mkdir(logDirectory, { recursive: true });
      await write('info', 'Logger initialized');
    },
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
    async clear() {
      await fs.rm(logDirectory, { recursive: true, force: true });
      await fs.mkdir(logDirectory, { recursive: true });
      return true;
    }
  };
}

function sanitizeMeta(meta) {
  const safe = { ...meta };
  delete safe.transcript;
  delete safe.audio;
  delete safe.rawAudio;
  return safe;
}
