import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { applyShadowMode, initShadowMode } from "@/lib/shadowMode";
import {
  installStealthNetworkGuard,
  uninstallStealthNetworkGuard,
} from "@/lib/stealthNetworkGuard";
import {
  loadStealthKillSwitch,
  saveStealthKillSwitch,
  type StealthKillSwitchPersisted,
} from "@/lib/stealthKillSwitchStorage";
import {
  STEALTH_MAX_RECENT_BLOCKS,
  type StealthBlockEvent,
} from "@/lib/stealthTypes";

export interface StealthKillSwitchState {
  isStealthMode: boolean;
  isTransitioning: boolean;
  networkBlocked: boolean;
  lastActivated: string | null;
  blockedRequests: number;
  totalBlockedAllTime: number;
  recentBlocks: StealthBlockEvent[];
  countdownPhase: number;
  activationProgress: number;
  isLoading: boolean;
}

interface StealthKillSwitchContextValue extends StealthKillSwitchState {
  activateStealthMode: () => void;
  deactivateStealthMode: () => void;
  toggleStealthMode: () => void;
  clearRecentBlocks: () => void;
}

const defaultState: StealthKillSwitchState = {
  isStealthMode: false,
  isTransitioning: false,
  networkBlocked: false,
  lastActivated: null,
  blockedRequests: 0,
  totalBlockedAllTime: 0,
  recentBlocks: [],
  countdownPhase: 0,
  activationProgress: 0,
  isLoading: true,
};

const StealthKillSwitchContext = createContext<StealthKillSwitchContextValue | null>(null);

function applyStealthVisuals(active: boolean) {
  applyShadowMode(active);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.stealthKillSwitch = active ? "active" : "off";
  }
}

function persistLocal(partial: StealthKillSwitchPersisted) {
  saveStealthKillSwitch(partial);
}

export function StealthKillSwitchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const blockedCountRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<StealthKillSwitchState>(defaultState);
  const [state, setState] = useState<StealthKillSwitchState>(defaultState);

  stateRef.current = state;

  const syncToBackend = useCallback(
    async (isActive: boolean, lastActivated: string | null, totalBlocked: number) => {
      if (!user) return;
      try {
        await supabase.from("user_settings").upsert(
          {
            user_id: user.id,
            setting_key: "stealth_mode",
            setting_value: {
              isStealthMode: isActive,
              lastActivated,
              totalBlocked,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,setting_key" }
        );
      } catch {
        /* best-effort */
      }
    },
    [user]
  );

  const engageStealth = useCallback(
    (lastActivated: string, totalBlockedAllTime: number) => {
      blockedCountRef.current = 0;
      installStealthNetworkGuard((event) => {
        blockedCountRef.current += 1;
        setState((prev) => ({
          ...prev,
          blockedRequests: blockedCountRef.current,
          recentBlocks: [event, ...prev.recentBlocks].slice(0, STEALTH_MAX_RECENT_BLOCKS),
        }));
      });
      applyStealthVisuals(true);
      persistLocal({
        isStealthMode: true,
        lastActivated,
        totalBlockedAllTime,
      });
      setState({
        isStealthMode: true,
        isTransitioning: false,
        networkBlocked: true,
        lastActivated,
        blockedRequests: 0,
        totalBlockedAllTime,
        recentBlocks: [],
        countdownPhase: 0,
        activationProgress: 100,
        isLoading: false,
      });
      syncToBackend(true, lastActivated, totalBlockedAllTime);
    },
    [syncToBackend]
  );

  const releaseStealth = useCallback(
    (lastActivated: string | null, totalBlockedAllTime: number) => {
      uninstallStealthNetworkGuard();
      initShadowMode();
      applyStealthVisuals(false);
      persistLocal({
        isStealthMode: false,
        lastActivated,
        totalBlockedAllTime,
      });
      setState({
        isStealthMode: false,
        isTransitioning: false,
        networkBlocked: false,
        lastActivated,
        blockedRequests: 0,
        recentBlocks: [],
        totalBlockedAllTime,
        countdownPhase: 0,
        activationProgress: 0,
        isLoading: false,
      });
      syncToBackend(false, lastActivated, totalBlockedAllTime);
    },
    [syncToBackend]
  );

  // Hydrate from localStorage on first paint (works for guests on the landing page)
  useEffect(() => {
    const local = loadStealthKillSwitch();
    if (local?.isStealthMode) {
      engageStealth(local.lastActivated ?? new Date().toISOString(), local.totalBlockedAllTime ?? 0);
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [engageStealth]);

  // Signed-in users: merge account preference from Supabase
  useEffect(() => {
    if (!user) return;

    const loadFromBackend = async () => {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("setting_value")
          .eq("user_id", user.id)
          .eq("setting_key", "stealth_mode")
          .maybeSingle();

        if (!data?.setting_value || error) return;

        const val =
          typeof data.setting_value === "string"
            ? JSON.parse(data.setting_value)
            : data.setting_value;

        if (val.isStealthMode === true) {
          engageStealth(val.lastActivated ?? new Date().toISOString(), val.totalBlocked ?? 0);
        } else {
          const local = loadStealthKillSwitch();
          if (local?.isStealthMode) {
            releaseStealth(local.lastActivated, local.totalBlockedAllTime ?? 0);
          }
        }
      } catch {
        /* ignore */
      }
    };

    loadFromBackend();
  }, [user, engageStealth, releaseStealth]);

  const activateStealthMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTransitioning: true,
      countdownPhase: 3,
      activationProgress: 0,
    }));
    blockedCountRef.current = 0;

    let phase = 3;
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      phase -= 1;
      if (phase > 0) {
        setState((prev) => ({
          ...prev,
          countdownPhase: phase,
          activationProgress: ((3 - phase) / 3) * 80,
        }));
      } else {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setState((prev) => ({ ...prev, countdownPhase: 0, activationProgress: 90 }));
        setTimeout(() => {
          setState((prev) => {
            engageStealth(new Date().toISOString(), prev.totalBlockedAllTime);
            return prev;
          });
        }, 500);
      }
    }, 800);
  }, [engageStealth]);

  const clearRecentBlocks = useCallback(() => {
    setState((prev) => ({ ...prev, recentBlocks: [] }));
  }, []);

  const deactivateStealthMode = useCallback(() => {
    setState((prev) => ({ ...prev, isTransitioning: true, activationProgress: 80 }));

    setTimeout(() => {
      setState((prev) => ({ ...prev, activationProgress: 40 }));
    }, 300);

    setTimeout(() => {
      setState((prev) => {
        const newTotal = prev.totalBlockedAllTime + prev.blockedRequests;
        releaseStealth(prev.lastActivated, newTotal);
        return prev;
      });
    }, 800);
  }, [releaseStealth]);

  const toggleStealthMode = useCallback(() => {
    const prev = stateRef.current;
    if (prev.isTransitioning || prev.isLoading) return;
    if (prev.isStealthMode) deactivateStealthMode();
    else activateStealthMode();
  }, [activateStealthMode, deactivateStealthMode]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const value: StealthKillSwitchContextValue = {
    ...state,
    activateStealthMode,
    deactivateStealthMode,
    toggleStealthMode,
    clearRecentBlocks,
  };

  return (
    <StealthKillSwitchContext.Provider value={value}>{children}</StealthKillSwitchContext.Provider>
  );
}

export function useStealthKillSwitch(): StealthKillSwitchContextValue {
  const ctx = useContext(StealthKillSwitchContext);
  if (!ctx) {
    throw new Error("useStealthKillSwitch must be used within StealthKillSwitchProvider");
  }
  return ctx;
}
