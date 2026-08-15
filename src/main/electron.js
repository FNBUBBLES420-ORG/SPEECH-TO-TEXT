import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const electron = require('electron');

export const { BrowserWindow, Menu, Tray, app, dialog, globalShortcut, ipcMain, nativeImage, screen, shell } =
  electron;
