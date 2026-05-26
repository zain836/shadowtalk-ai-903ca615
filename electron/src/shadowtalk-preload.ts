import { contextBridge, ipcRenderer } from 'electron';

const invoke = <T>(channel: string, ...args: unknown[]): Promise<T> =>
  ipcRenderer.invoke(channel, ...args) as Promise<T>;

contextBridge.exposeInMainWorld('shadowtalkDesktop', {
  isDesktop: true as const,
  platform: process.platform,

  getInfo: () => invoke('st-desktop:getInfo'),

  openFile: (options?: Electron.OpenDialogOptions) =>
    invoke<Electron.OpenDialogReturnValue>('st-desktop:openFile', options ?? {}),

  saveFile: (options?: Electron.SaveDialogOptions) =>
    invoke<Electron.SaveDialogReturnValue>('st-desktop:saveFile', options ?? {}),

  readTextFile: (filePath: string) => invoke<string>('st-desktop:readTextFile', filePath),

  writeTextFile: (filePath: string, content: string) =>
    invoke<{ ok: boolean }>('st-desktop:writeTextFile', filePath, content),

  openPath: (filePath: string) => invoke<void>('st-desktop:openPath', filePath),

  openExternal: (url: string) => invoke<void>('st-desktop:openExternal', url),

  revealInFolder: (filePath: string) => invoke<void>('st-desktop:revealInFolder', filePath),

  showNotification: (title: string, body: string) =>
    invoke<void>('st-desktop:notify', title, body),

  getAutoLaunch: () => invoke<boolean>('st-desktop:getAutoLaunch'),

  setAutoLaunch: (enabled: boolean) => invoke<boolean>('st-desktop:setAutoLaunch', enabled),
});
