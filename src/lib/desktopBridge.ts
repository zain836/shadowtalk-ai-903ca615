import { Capacitor } from '@capacitor/core';
import type { ShadowTalkDesktopAPI, ShadowTalkDesktopInfo } from '@/types/shadowtalk-desktop';

/** True when running inside the ShadowTalk Electron desktop app */
export function isShadowTalkDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.shadowtalkDesktop?.isDesktop) return true;
  try {
    return Capacitor.getPlatform() === 'electron';
  } catch {
    return false;
  }
}

export function getDesktopAPI(): ShadowTalkDesktopAPI | null {
  return window.shadowtalkDesktop ?? null;
}

export async function getDesktopInfo(): Promise<ShadowTalkDesktopInfo | null> {
  const api = getDesktopAPI();
  if (!api) return null;
  return api.getInfo();
}

/** Pick a file via native dialog; returns text content for text-like extensions */
export async function pickAndReadTextFile(
  filters?: { name: string; extensions: string[] }[]
): Promise<{ path: string; content: string } | null> {
  const api = getDesktopAPI();
  if (!api) return null;

  const result = await api.openFile({
    title: 'Open file in ShadowTalk',
    properties: ['openFile'],
    filters: filters ?? [
      { name: 'Documents', extensions: ['txt', 'md', 'json', 'csv', 'pdf'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePaths[0]) return null;
  const path = result.filePaths[0];
  const content = await api.readTextFile(path);
  return { path, content };
}

/** Save text via native save dialog */
export async function saveTextWithDialog(
  defaultName: string,
  content: string
): Promise<string | null> {
  const api = getDesktopAPI();
  if (!api) return null;

  const result = await api.saveFile({
    title: 'Export from ShadowTalk',
    defaultPath: defaultName,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Text', extensions: ['txt'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  });

  if (result.canceled || !result.filePath) return null;
  await api.writeTextFile(result.filePath, content);
  return result.filePath;
}

export async function desktopNotify(title: string, body: string): Promise<void> {
  const api = getDesktopAPI();
  if (api) {
    await api.showNotification(title, body);
    return;
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
