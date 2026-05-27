import { useCallback, useEffect, useState } from "react";
import {
  type CustomAiKeysConfig,
  loadCustomAiConfig,
  saveCustomAiConfig,
  hasActiveCustomKey,
  shouldShowApiKeysSetup,
} from "@/lib/customApiKeys";

export function useCustomApiKeys() {
  const [config, setConfig] = useState<CustomAiKeysConfig>(() => loadCustomAiConfig());
  const [showSetupDialog, setShowSetupDialog] = useState(false);

  useEffect(() => {
    const cfg = loadCustomAiConfig();
    setConfig(cfg);
    if (shouldShowApiKeysSetup(cfg)) {
      setShowSetupDialog(true);
    }
  }, []);

  const persist = useCallback((next: CustomAiKeysConfig) => {
    saveCustomAiConfig(next);
    setConfig(next);
  }, []);

  const saveKeys = useCallback(
    (partial: Pick<CustomAiKeysConfig, "provider" | "apiKey" | "model">) => {
      persist({
        ...config,
        ...partial,
        usePlatformDefault: false,
        setupDismissed: true,
      });
      setShowSetupDialog(false);
    },
    [config, persist],
  );

  const usePlatformDefault = useCallback(() => {
    persist({
      ...config,
      usePlatformDefault: true,
      apiKey: "",
      setupDismissed: true,
    });
    setShowSetupDialog(false);
  }, [config, persist]);

  const dismissSetup = useCallback(() => {
    persist({ ...config, setupDismissed: true });
    setShowSetupDialog(false);
  }, [config, persist]);

  const openSetup = useCallback(() => setShowSetupDialog(true), []);

  return {
    config,
    showSetupDialog,
    setShowSetupDialog,
    saveKeys,
    usePlatformDefault,
    dismissSetup,
    openSetup,
    hasCustomKey: hasActiveCustomKey(config),
    persist,
  };
}
