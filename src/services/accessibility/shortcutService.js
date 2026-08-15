import { globalShortcut } from '../../main/electron.js';

export class ShortcutService {
  constructor(settings, logger) {
    this.settings = settings;
    this.logger = logger;
  }

  register(mainWindow) {
    this.unregisterAll();
    const shortcuts = this.settings.get().shortcuts;
    this.tryRegister(shortcuts.startStop, () => mainWindow.webContents.send('transcription:toggle'));
    this.tryRegister(shortcuts.pauseResume, () => mainWindow.webContents.send('transcription:pause-resume'));
    this.tryRegister(shortcuts.showHide, () => {
      if (mainWindow.isVisible()) mainWindow.hide();
      else mainWindow.show();
    });
    this.tryRegister(shortcuts.captionWindow, () => mainWindow.webContents.send('caption:toggle'));
    this.tryRegister(shortcuts.copyLatest, () => mainWindow.webContents.send('transcript:copy-latest'));
  }

  tryRegister(accelerator, callback) {
    if (!accelerator) return;
    const ok = globalShortcut.register(accelerator, callback);
    if (!ok) this.logger.warn('Global shortcut conflict', { accelerator });
  }

  unregisterAll() {
    globalShortcut.unregisterAll();
  }
}
