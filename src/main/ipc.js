import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { dialog, ipcMain, shell } from './electron.js';
import { exportTranscript } from '../shared/exporters.js';
import { OFFICIAL_RELEASE_URL } from '../shared/constants.js';
import {
  assertString,
  isInsideDirectory,
  validateTrustedReleaseUrl,
  validateUserWritablePath
} from '../shared/validators.js';
import { createCaptionWindow, getCaptionWindow, listDisplays } from './windows.js';
import { TranscriptionService } from '../services/transcription/transcriptionService.js';
import { fetchLatestRelease } from '../services/models/updateFetch.js';
import { normalizeReleaseInfo } from '../shared/updates.js';

export function registerIpcHandlers({ app, mainWindow, services }) {
  const transcription = new TranscriptionService(services, mainWindow);

  ipcMain.handle('app:get-bootstrap', async () => ({
    version: app.getVersion(),
    paths: getPaths(app),
    settings: services.settings.get(),
    models: await services.models.list(),
    transcripts: await services.transcripts.list(),
    diagnostics: diagnostics(app, services)
  }));
  ipcMain.handle('app:quit', async () => {
    app.isQuitting = true;
    getCaptionWindow()?.destroy();
    mainWindow.destroy();
    app.quit();
    return true;
  });

  ipcMain.handle('settings:update', async (_event, patch) => {
    const settings = services.settings.update(patch);
    services.shortcuts.register(mainWindow);
    return settings;
  });
  ipcMain.handle('settings:reset-category', async (_event, category) =>
    services.settings.resetCategory(assertString(category, 'Category', 40))
  );
  ipcMain.handle('settings:reset-all', async () => services.settings.resetAll());
  ipcMain.handle('settings:save-now', async () => services.settings.saveNow());
  ipcMain.handle('settings:export', async () => exportSettings(mainWindow, services));
  ipcMain.handle('settings:import', async () => importSettings(mainWindow, services));

  ipcMain.handle('audio:list-devices', async () => []);
  ipcMain.handle('display:list', async () => listDisplays());

  ipcMain.handle('transcription:start', async (_event, options) => transcription.start(options));
  ipcMain.handle('transcription:pause', async () => transcription.pause());
  ipcMain.handle('transcription:resume', async () => transcription.resume());
  ipcMain.handle('transcription:stop', async () => transcription.stop());
  ipcMain.handle('transcription:submit-audio', async (_event, chunk) => transcription.submitAudio(chunk));

  ipcMain.handle('transcripts:list', async () => services.transcripts.list());
  ipcMain.handle('transcripts:get', async (_event, id) =>
    services.transcripts.get(assertString(id, 'Transcript id', 80))
  );
  ipcMain.handle('transcripts:save', async (_event, transcript) => services.transcripts.save(transcript));
  ipcMain.handle('transcripts:delete', async (_event, id) =>
    services.transcripts.delete(assertString(id, 'Transcript id', 80))
  );
  ipcMain.handle('transcripts:rename', async (_event, payload) =>
    services.transcripts.rename(
      assertString(payload?.id, 'Transcript id', 80),
      assertString(payload?.title || 'Untitled', 'Title', 120)
    )
  );
  ipcMain.handle('transcripts:export', async (_event, payload) => exportToFile(payload, services, mainWindow));

  ipcMain.handle('models:list', async () => services.models.list());
  ipcMain.handle('models:download', async (_event, id) =>
    services.models.download(assertString(id, 'Model id', 40), mainWindow)
  );
  ipcMain.handle('models:cancel', async (_event, id) => services.models.cancel(assertString(id, 'Model id', 40)));
  ipcMain.handle('models:remove', async (_event, id) =>
    services.models.remove(assertString(id, 'Model id', 40))
  );

  ipcMain.handle('obs:choose-output', async () => chooseObsOutput(mainWindow, services));
  ipcMain.handle('obs:update-output', async (_event, text) => services.obs.writeCaptionText(String(text || '')));

  ipcMain.handle('caption:toggle', async () => {
    const existing = getCaptionWindow();
    if (existing) {
      existing.close();
      services.settings.update({
        obs: { captionWindow: { ...services.settings.get().obs.captionWindow, enabled: false } }
      });
      return false;
    }
    createCaptionWindow({ settings: services.settings, logger: services.logger });
    services.settings.update({
      obs: { captionWindow: { ...services.settings.get().obs.captionWindow, enabled: true } }
    });
    return true;
  });
  ipcMain.handle('caption:update', async (_event, payload) => {
    const win = getCaptionWindow();
    if (win) {
      win.setAlwaysOnTop(Boolean(payload?.alwaysOnTop));
      win.setIgnoreMouseEvents(Boolean(payload?.clickThrough), { forward: true });
      win.webContents.send('caption:update', payload);
    }
    return true;
  });

  ipcMain.handle('updates:check', async () => {
    const release = await fetchLatestRelease();
    return normalizeReleaseInfo(app.getVersion(), release);
  });
  ipcMain.handle('updates:download', async (_event, asset) =>
    downloadUpdateAsset(app, mainWindow, services, asset)
  );
  ipcMain.handle('updates:open-download-folder', async (_event, filePath) => {
    const safePath = assertString(filePath, 'Downloaded update path', 500);
    await shell.showItemInFolder(safePath);
    return true;
  });
  ipcMain.handle('updates:run-installer', async (_event, filePath) => {
    const safePath = assertString(filePath, 'Downloaded update path', 500);
    if (!isInsideDirectory(path.resolve(safePath), path.resolve(app.getPath('downloads')))) {
      throw new Error('Only downloaded update installers from your Downloads folder can be opened.');
    }
    await shell.openPath(safePath);
    return true;
  });
  ipcMain.handle('updates:open-release-page', async (_event, url = OFFICIAL_RELEASE_URL) => {
    if (!validateTrustedReleaseUrl(url)) throw new Error('The release URL is not trusted.');
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('diagnostics:get', async () => diagnostics(app, services));
  ipcMain.handle('diagnostics:open-logs', async () => shell.openPath(services.logger.logDirectory));
  ipcMain.handle('privacy:clear', async (_event, scope) => clearPrivacyData(String(scope), services));
}

async function downloadUpdateAsset(appInstance, mainWindow, services, asset) {
  if (!asset?.downloadUrl || !validateTrustedReleaseUrl(asset.downloadUrl)) {
    throw new Error('The update download URL is not trusted.');
  }
  const fileName = sanitizeInstallerName(asset.name || 'Speech-to-Text-Application-Update.exe');
  if (!/\.(exe|msi)$/i.test(fileName)) {
    throw new Error('The release asset is not a Windows installer.');
  }
  const downloads = appInstance.getPath('downloads');
  const targetPath = path.join(downloads, fileName);
  const tempPath = `${targetPath}.download`;
  const response = await fetch(asset.downloadUrl, {
    headers: {
      Accept: 'application/octet-stream',
      'User-Agent': 'Speech-to-Text-Application'
    }
  });
  if (!response.ok || !response.body) throw new Error('The update download failed.');

  const total = Number(response.headers.get('content-length') || asset.size || 0);
  let received = 0;
  const file = fsSync.createWriteStream(tempPath);
  try {
    for await (const chunk of response.body) {
      received += chunk.length;
      file.write(chunk);
      mainWindow.webContents.send('updates:download-progress', {
        fileName,
        received,
        total
      });
    }
    await new Promise((resolve, reject) => {
      file.end(resolve);
      file.on('error', reject);
    });
    const stats = await fs.stat(tempPath);
    if (asset.size && stats.size < asset.size * 0.95) {
      throw new Error('The downloaded update did not pass size verification.');
    }
    await fs.rename(tempPath, targetPath);
    await services.logger.info('Manual update downloaded', { fileName, targetPath });
    return { fileName, filePath: targetPath, size: stats.size };
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    await services.logger.error('Manual update download failed', { fileName, message: error.message });
    throw error;
  }
}

async function exportToFile(payload, services, mainWindow) {
  const format = String(payload?.format || 'txt');
  const transcript = payload?.transcript;
  const data = exportTranscript(transcript, format);
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export transcript',
    defaultPath: `${sanitizeName(transcript?.title || 'transcript')}.${format}`,
    filters: [{ name: format.toUpperCase(), extensions: [format] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  if (!validateUserWritablePath(result.filePath, services.transcripts.baseDirectory)) {
    throw new Error('Choose a writable location inside your user profile.');
  }
  await fs.writeFile(result.filePath, data, 'utf8');
  services.settings.update({ storage: { preferredExportDirectory: result.filePath } });
  return { canceled: false, filePath: result.filePath };
}

async function chooseObsOutput(mainWindow, services) {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Choose OBS live caption text file',
    defaultPath: 'live-captions.txt',
    filters: [{ name: 'Text', extensions: ['txt'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  if (!validateUserWritablePath(result.filePath, services.transcripts.baseDirectory)) {
    throw new Error('Choose a writable location inside your user profile.');
  }
  services.settings.update({ obs: { enabled: true, outputPath: result.filePath } });
  return { canceled: false, filePath: result.filePath };
}

async function exportSettings(mainWindow, services) {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export application settings',
    defaultPath: 'Speech-to-Text-Application-settings.json',
    filters: [{ name: 'JSON settings backup', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  if (!validateUserWritablePath(result.filePath, services.settings.baseDirectory)) {
    throw new Error('Choose a writable location inside your user profile.');
  }
  await services.settings.exportTo(result.filePath);
  return { canceled: false, filePath: result.filePath };
}

async function importSettings(mainWindow, services) {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import application settings',
    properties: ['openFile'],
    filters: [{ name: 'JSON settings backup', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  if (!validateUserWritablePath(filePath, services.settings.baseDirectory)) {
    throw new Error('Choose a settings file inside your user profile.');
  }
  const settings = await services.settings.importFrom(filePath);
  services.shortcuts.register(mainWindow);
  return { canceled: false, settings };
}

async function clearPrivacyData(scope, services) {
  if (scope === 'transcripts') return services.transcripts.clear();
  if (scope === 'logs') return services.logger.clear();
  if (scope === 'models') return services.models.clear();
  if (scope === 'settings') return services.settings.resetAll();
  throw new Error('Unknown privacy cleanup scope.');
}

function getPaths(appInstance) {
  return {
    userData: appInstance.getPath('userData'),
    logs: appInstance.getPath('logs'),
    temp: appInstance.getPath('temp')
  };
}

function diagnostics(appInstance, services) {
  return {
    appVersion: appInstance.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    os: `${process.platform} ${process.arch}`,
    engine: services.settings.get().transcription.engine,
    model: services.settings.get().transcription.defaultModel,
    storage: getPaths(appInstance),
    audioDeviceStatus: 'Renderer microphone permission required'
  };
}

function sanitizeName(name) {
  return String(name).replace(/[<>:"/\\|?*]/g, '-').slice(0, 80);
}

function sanitizeInstallerName(name) {
  return String(name).replace(/[<>:"/\\|?*]/g, '-').slice(0, 140);
}
