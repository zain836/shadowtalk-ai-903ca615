/**
 * Tier A bootstrap — install default SmolLM for all users (web + desktop).
 * Tier C: desktop may skip download when bundled model flag is set.
 */

import { useCallback, useEffect, useState } from "react";
import { getSmolLMEngine, isTierAModelCached, TIER_A_SIZE_MB } from "@/lib/offline/smollmEngine";
import { isAnyLocalModelReady } from "@/lib/offline/localChat";
import { getGemmaEngine } from "@/lib/offline/gemmaEngine";
import { isShadowTalkDesktop, getDesktopInfo } from "@/lib/desktopBridge";

const BOOTSTRAP_DONE_KEY = "shadowtalk_offline_tier_a_done";
const BOOTSTRAP_SKIP_KEY = "shadowtalk_offline_tier_a_skip";
const BOOTSTRAP_CONSENT_KEY = "shadowtalk_offline_tier_a_consent";

export type BootstrapPhase =
  | "idle"
  | "needs_consent"
  | "downloading"
  | "ready"
  | "skipped"
  | "error";

export function useOfflineBootstrap() {
  const [phase, setPhase] = useState<BootstrapPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDesktopBundled, setIsDesktopBundled] = useState(false);

  const checkState = useCallback(async () => {
    if (localStorage.getItem(BOOTSTRAP_SKIP_KEY) === "1") {
      setPhase("skipped");
      return;
    }
    if (localStorage.getItem(BOOTSTRAP_DONE_KEY) === "1" || isAnyLocalModelReady()) {
      setPhase("ready");
      return;
    }
    if (getGemmaEngine().isReady) {
      setPhase("ready");
      return;
    }

    const cached = await isTierAModelCached();
    if (cached) {
      setPhase("ready");
      return;
    }

    if (isShadowTalkDesktop()) {
      const info = await getDesktopInfo();
      const bundled = !!(info as { offlineModelBundled?: boolean })?.offlineModelBundled;
      setIsDesktopBundled(bundled);
      if (bundled) {
        setPhase("downloading");
        return;
      }
    }

    if (localStorage.getItem(BOOTSTRAP_CONSENT_KEY) === "1") {
      setPhase("downloading");
      return;
    }

    setPhase("needs_consent");
  }, []);

  useEffect(() => {
    checkState();
  }, [checkState]);

  const acceptAndInstall = useCallback(async () => {
    localStorage.setItem(BOOTSTRAP_CONSENT_KEY, "1");
    setPhase("downloading");
    setError(null);

    const ok = await getSmolLMEngine().ensureLoaded((p) => {
      setProgress(p.progress);
      setStatusText(p.text);
    });

    if (ok) {
      localStorage.setItem(BOOTSTRAP_DONE_KEY, "1");
      setPhase("ready");
    } else {
      setPhase("error");
      setError("Could not install offline AI. Check connection and storage, then retry.");
    }
    return ok;
  }, []);

  const skipInstall = useCallback(() => {
    localStorage.setItem(BOOTSTRAP_SKIP_KEY, "1");
    setPhase("skipped");
  }, []);

  const retry = useCallback(() => {
    setPhase("downloading");
    void acceptAndInstall();
  }, [acceptAndInstall]);

  // Auto-start when consent already given or desktop bundled
  useEffect(() => {
    if (phase !== "downloading") return;
    if (isAnyLocalModelReady()) {
      setPhase("ready");
      localStorage.setItem(BOOTSTRAP_DONE_KEY, "1");
      return;
    }
    void acceptAndInstall();
  }, [phase, acceptAndInstall]);

  return {
    phase,
    progress,
    statusText,
    error,
    isDesktopBundled,
    tierASizeMB: TIER_A_SIZE_MB,
    acceptAndInstall,
    skipInstall,
    retry,
    refresh: checkState,
  };
}
