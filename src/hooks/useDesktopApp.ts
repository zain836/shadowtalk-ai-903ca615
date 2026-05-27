import { useCallback, useEffect, useState } from 'react';
import {
  desktopNotify,
  getDesktopAPI,
  getDesktopInfo,
  isShadowTalkDesktop,
  pickAndReadTextFile,
  saveTextWithDialog,
} from '@/lib/desktopBridge';
import type { ShadowTalkDesktopInfo } from '@/types/shadowtalk-desktop';

export function useDesktopApp() {
  const [isDesktop] = useState(() => isShadowTalkDesktop());
  const [info, setInfo] = useState<ShadowTalkDesktopInfo | null>(null);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [loading, setLoading] = useState(isDesktop);

  useEffect(() => {
    if (!isDesktop) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const desktopInfo = await getDesktopInfo();
        setInfo(desktopInfo);
        const api = getDesktopAPI();
        if (api) {
          setAutoLaunch(await api.getAutoLaunch());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isDesktop]);

  const toggleAutoLaunch = useCallback(async (enabled: boolean) => {
    const api = getDesktopAPI();
    if (!api) return;
    await api.setAutoLaunch(enabled);
    setAutoLaunch(enabled);
  }, []);

  return {
    isDesktop,
    loading,
    info,
    autoLaunch,
    toggleAutoLaunch,
    pickAndReadTextFile,
    saveTextWithDialog,
    notify: desktopNotify,
    api: getDesktopAPI(),
  };
}
