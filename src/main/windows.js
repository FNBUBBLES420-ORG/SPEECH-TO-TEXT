import path from 'node:path';
import { BrowserWindow, Menu, Tray, app, nativeImage, screen, shell } from './electron.js';
import { validateTrustedReleaseUrl } from '../shared/validators.js';
import { OFFICIAL_RELEASE_URL } from '../shared/constants.js';

let captionWindow;
const appIcon = path.join(app.getAppPath(), 'assets/icons/app-icon.ico');
const trayIcon = path.join(app.getAppPath(), 'assets/icons/app-icon-32.png');

export function createMainWindow({ settings, logger }) {
  const win = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 660,
    backgroundColor: '#101218',
    title: 'Speech-to-Text Application',
    icon: appIcon,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#151922',
      symbolColor: '#f6f8fc',
      height: 38
    },
    webPreferences: {
      preload: path.join(app.getAppPath(), 'src/preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: true
    }
  });

  win.removeMenu();
  win.loadFile(path.join(app.getAppPath(), 'src/renderer/index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (validateTrustedReleaseUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      logger.warn('Blocked unexpected navigation', { url });
    }
  });

  win.on('close', (event) => {
    const generalSettings = settings.get().general;
    if (!app.isQuitting && generalSettings.closeBehavior === 'tray' && generalSettings.trayEnabled) {
      event.preventDefault();
      win.hide();
    }
  });

  return win;
}

export function createTray({ mainWindow, settings, services }) {
  if (!settings.get().general.trayEnabled) return null;
  const image = nativeImage.createFromPath(trayIcon);
  const tray = new Tray(image);
  tray.setToolTip('Speech-to-Text Application');

  const updateMenu = () => {
    const state = services.obs.getState();
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Open', click: () => mainWindow.show() },
        {
          label: state.listening ? 'Stop Transcription' : 'Start Transcription',
          click: () => mainWindow.webContents.send('transcription:toggle')
        },
        {
          label: 'Pause / Resume',
          click: () => mainWindow.webContents.send('transcription:pause-resume')
        },
        {
          label: 'Caption Window',
          click: () => mainWindow.webContents.send('caption:toggle')
        },
        { label: 'Settings', click: () => mainWindow.webContents.send('navigation:open', 'settings') },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ])
    );
  };

  updateMenu();
  tray.on('click', () => mainWindow.show());
  return tray;
}

export function createCaptionWindow({ settings, logger }) {
  const captionSettings = settings.get().obs.captionWindow;
  const displays = screen.getAllDisplays();
  const selectedDisplay = displays.find((display) => String(display.id) === String(captionSettings.monitorId));
  const defaultBounds = selectedDisplay?.workArea || {};
  captionWindow = new BrowserWindow({
    width: captionSettings.bounds?.width || 900,
    height: captionSettings.bounds?.height || 180,
    x: captionSettings.bounds?.x ?? defaultBounds.x,
    y: captionSettings.bounds?.y ?? defaultBounds.y,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: captionSettings.alwaysOnTop,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'src/preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  captionWindow.loadFile(path.join(app.getAppPath(), 'src/renderer/caption.html'));
  captionWindow.setIgnoreMouseEvents(Boolean(captionSettings.clickThrough), { forward: true });
  captionWindow.on('close', () => {
    settings.update({
      obs: { captionWindow: { ...settings.get().obs.captionWindow, bounds: captionWindow.getBounds() } }
    });
    logger.info('Caption window closed');
    captionWindow = null;
  });
  return captionWindow;
}

export function listDisplays() {
  return screen.getAllDisplays().map((display, index) => ({
    id: String(display.id),
    label: `Monitor ${index + 1}`,
    bounds: display.bounds,
    workArea: display.workArea,
    primary: display.id === screen.getPrimaryDisplay().id
  }));
}

export function restoreCaptionWindow({ settings, logger }) {
  if (settings.get().obs.captionWindow.enabled) {
    createCaptionWindow({ settings, logger });
  }
}

export function getCaptionWindow() {
  return captionWindow;
}

export function openOfficialReleasePage() {
  if (validateTrustedReleaseUrl(OFFICIAL_RELEASE_URL)) shell.openExternal(OFFICIAL_RELEASE_URL);
}
