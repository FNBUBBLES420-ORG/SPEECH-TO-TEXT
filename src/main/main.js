import { app, BrowserWindow } from './electron.js';
import { createMainWindow, createTray, restoreCaptionWindow } from './windows.js';
import { registerIpcHandlers } from './ipc.js';
import { createLogger } from '../services/logging/logger.js';
import { SettingsService } from '../services/settings/settingsService.js';
import { TranscriptService } from '../services/storage/transcriptService.js';
import { ModelService } from '../services/models/modelService.js';
import { ObsService } from '../services/obs/obsService.js';
import { ShortcutService } from '../services/accessibility/shortcutService.js';

app.setName('Speech-to-Text Application');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

let mainWindow;
let tray;
let services;

async function bootstrap() {
  const logger = createLogger(app);
  const settings = new SettingsService(app, logger);
  const transcripts = new TranscriptService(app, logger);
  const models = new ModelService(app, logger);
  const obs = new ObsService(settings, logger);
  const shortcuts = new ShortcutService(settings, logger);

  services = { logger, settings, transcripts, models, obs, shortcuts };
  await Promise.all([settings.init(), transcripts.init(), models.init(), logger.init()]);

  mainWindow = createMainWindow({ app, settings, logger });
  registerIpcHandlers({ app, mainWindow, services });
  tray = createTray({ app, mainWindow, settings, services });
  globalThis.captionPulseTray = tray;
  shortcuts.register(mainWindow);
  restoreCaptionWindow({ app, settings, logger });

  app.on('second-instance', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(bootstrap).catch((error) => {
  console.error('Application startup failed', error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) bootstrap();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  services?.shortcuts?.unregisterAll();
  BrowserWindowCleanup();
});

function BrowserWindowCleanup() {
  for (const window of BrowserWindow.getAllWindows()) {
    window.destroy();
  }
}
