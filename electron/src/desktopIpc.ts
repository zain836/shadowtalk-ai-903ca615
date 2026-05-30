import { app, dialog, ipcMain, Notification, shell } from 'electron';
import { access } from 'fs/promises';
import { readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const CHANNEL = {
  getInfo: 'st-desktop:getInfo',
  openFile: 'st-desktop:openFile',
  saveFile: 'st-desktop:saveFile',
  readTextFile: 'st-desktop:readTextFile',
  writeTextFile: 'st-desktop:writeTextFile',
  openPath: 'st-desktop:openPath',
  openExternal: 'st-desktop:openExternal',
  notify: 'st-desktop:notify',
  getAutoLaunch: 'st-desktop:getAutoLaunch',
  setAutoLaunch: 'st-desktop:setAutoLaunch',
  revealInFolder: 'st-desktop:revealInFolder',
} as const;

export function registerDesktopIpc(): void {
  ipcMain.handle(CHANNEL.getInfo, async () => {
    const bundledDir = join(process.resourcesPath, 'offline-models', 'SmolLM2-135M-Instruct-q4f16_1-MLC');
    let offlineModelBundled = false;
    try {
      await access(bundledDir);
      offlineModelBundled = true;
    } catch {
      offlineModelBundled = false;
    }
    return {
      platform: process.platform,
      arch: process.arch,
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      userDataPath: app.getPath('userData'),
      documentsPath: app.getPath('documents'),
      homePath: homedir(),
      shadowtalkDataPath: join(app.getPath('userData'), 'shadowtalk-data'),
      offlineModelBundled,
      offlineModelPath: offlineModelBundled ? bundledDir : undefined,
    };
  });

  ipcMain.handle(CHANNEL.openFile, async (_event, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      ...options,
    });
    return result;
  });

  ipcMain.handle(CHANNEL.saveFile, async (_event, options: Electron.SaveDialogOptions) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });

  ipcMain.handle(CHANNEL.readTextFile, async (_event, filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }
    return readFile(filePath, 'utf-8');
  });

  ipcMain.handle(CHANNEL.writeTextFile, async (_event, filePath: string, content: string) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }
    await writeFile(filePath, content, 'utf-8');
    return { ok: true };
  });

  ipcMain.handle(CHANNEL.openPath, async (_event, filePath: string) => {
    await shell.openPath(filePath);
  });

  ipcMain.handle(CHANNEL.openExternal, async (_event, url: string) => {
    await shell.openExternal(url);
  });

  ipcMain.handle(CHANNEL.revealInFolder, async (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle(CHANNEL.notify, async (_event, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  ipcMain.handle(CHANNEL.getAutoLaunch, async () => {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  });

  ipcMain.handle(CHANNEL.setAutoLaunch, async (_event, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled });
    return enabled;
  });
}
