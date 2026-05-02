/**
 * useGemmaOffline
 * --------------------------------------------------
 * React hook that orchestrates the on-device Gemma engine for the chatbot UI.
 *
 *  - Tracks load progress + readiness
 *  - Persists user preferences (auto / local-only / cloud-only, model size)
 *  - Tracks online/offline transitions
 *  - Exposes a streaming `chat` helper that uses Gemma when local routing wins
 *  - Stores nothing sensitive in cloud — model preference is local-only.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getGemmaEngine,
  GEMMA_MODELS,
  type GemmaModelKey,
  type LoadProgress,
  detectCapabilities,
  type EngineCapabilities,
} from "@/lib/offline/gemmaEngine";
import {
  getRoutingMode,
  setRoutingMode,
  getPreferredLocalModel,
  setPreferredLocalModel,
  decideRoute,
  type RouterMessage,
  type RoutingMode,
} from "@/lib/offline/hybridRouter";
import { requestPersistentStorage } from "@/lib/offline/opfsModelStore";

export interface UseGemmaOfflineState {
  isOnline: boolean;
  capabilities: EngineCapabilities | null;
  isReady: boolean;
  isLoading: boolean;
  progress: LoadProgress | null;
  error: string | null;
  routingMode: RoutingMode;
  preferredModel: GemmaModelKey;
  activeModelLabel: string;
}

export function useGemmaOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [capabilities, setCapabilities] = useState<EngineCapabilities | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [routingMode, setRoutingModeState] = useState<RoutingMode>(getRoutingMode());
  const [preferredModel, setPreferredModelState] = useState<GemmaModelKey>(
    getPreferredLocalModel(),
  );

  useEffect(() => {
    detectCapabilities().then(setCapabilities).catch(() => null);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const loadModel = useCallback(
    async (modelKey: GemmaModelKey = preferredModel) => {
      if (isLoading) return false;
      setIsLoading(true);
      setError(null);
      try {
        await requestPersistentStorage();
        const engine = getGemmaEngine();
        await engine.load(modelKey, (p) => setProgress(p));
        setIsReady(true);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load model";
        setError(msg);
        setIsReady(false);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, preferredModel],
  );

  const unloadModel = useCallback(async () => {
    await getGemmaEngine().dispose();
    setIsReady(false);
    setProgress(null);
  }, []);

  const updateRoutingMode = useCallback((mode: RoutingMode) => {
    setRoutingMode(mode);
    setRoutingModeState(mode);
  }, []);

  const updatePreferredModel = useCallback((key: GemmaModelKey) => {
    setPreferredLocalModel(key as "small" | "default" | "large");
    setPreferredModelState(key);
  }, []);

  const route = useCallback(
    (messages: RouterMessage[]) => decideRoute(messages, isOnline),
    [isOnline],
  );

  const chatLocal = useCallback(
    async (
      messages: RouterMessage[],
      onToken?: (t: string) => void,
    ): Promise<string> => {
      const engine = getGemmaEngine();
      if (!engine.isReady) throw new Error("Local model not loaded");
      return engine.chat(messages, { onToken });
    },
    [],
  );

  const state: UseGemmaOfflineState = {
    isOnline,
    capabilities,
    isReady,
    isLoading,
    progress,
    error,
    routingMode,
    preferredModel,
    activeModelLabel: GEMMA_MODELS[preferredModel].label,
  };

  return {
    ...state,
    loadModel,
    unloadModel,
    updateRoutingMode,
    updatePreferredModel,
    route,
    chatLocal,
    models: GEMMA_MODELS,
  };
}
