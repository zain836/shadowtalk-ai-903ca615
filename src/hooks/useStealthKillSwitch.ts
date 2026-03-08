import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface StealthKillSwitchState {
  isStealthMode: boolean;
  isTransitioning: boolean;
  networkBlocked: boolean;
  lastActivated: string | null;
  blockedRequests: number;
  totalBlockedAllTime: number;
  countdownPhase: number;
  activationProgress: number;
  isLoading: boolean;
}

export const useStealthKillSwitch = () => {
  const { user } = useAuth();
  const blockedCountRef = useRef(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<StealthKillSwitchState>({
    isStealthMode: false,
    isTransitioning: false,
    networkBlocked: false,
    lastActivated: null,
    blockedRequests: 0,
    totalBlockedAllTime: 0,
    countdownPhase: 0,
    activationProgress: 0,
    isLoading: true,
  });

  // Load stealth state from backend on mount
  useEffect(() => {
    const loadFromBackend = async () => {
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', 'stealth_mode')
          .maybeSingle();

        if (data?.setting_value && !error) {
          const val = typeof data.setting_value === 'string'
            ? JSON.parse(data.setting_value)
            : data.setting_value;

          const isActive = val.isStealthMode === true;
          setState(prev => ({
            ...prev,
            isStealthMode: isActive,
            networkBlocked: isActive,
            lastActivated: val.lastActivated || null,
            totalBlockedAllTime: val.totalBlocked || 0,
            activationProgress: isActive ? 100 : 0,
            isLoading: false,
          }));
          blockedCountRef.current = 0;
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadFromBackend();
  }, [user]);

  // Persist to backend
  const syncToBackend = useCallback(async (isActive: boolean, lastActivated: string | null, totalBlocked: number) => {
    if (!user) return;
    try {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        setting_key: 'stealth_mode',
        setting_value: {
          isStealthMode: isActive,
          lastActivated,
          totalBlocked,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,setting_key' });
    } catch { /* best-effort */ }
  }, [user]);

  // Block all fetch/XHR when stealth mode is active
  useEffect(() => {
    if (!state.isStealthMode) return;

    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;

    window.fetch = function (...args: Parameters<typeof fetch>) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
      if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('localhost')) {
        return originalFetch.apply(window, args);
      }
      blockedCountRef.current += 1;
      setState(prev => ({ ...prev, blockedRequests: blockedCountRef.current }));
      return Promise.reject(new Error('Network blocked by Stealth Mode'));
    };

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.startsWith('blob:') || urlStr.startsWith('data:') || urlStr.includes('localhost')) {
        return originalXHROpen.apply(this, [method, url, ...rest] as any);
      }
      blockedCountRef.current += 1;
      setState(prev => ({ ...prev, blockedRequests: blockedCountRef.current }));
      throw new Error('Network blocked by Stealth Mode');
    };

    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
    };
  }, [state.isStealthMode]);

  const activateStealthMode = useCallback(() => {
    setState(prev => ({ ...prev, isTransitioning: true, countdownPhase: 3, activationProgress: 0 }));
    blockedCountRef.current = 0;

    let phase = 3;
    countdownRef.current = setInterval(() => {
      phase -= 1;
      if (phase > 0) {
        setState(prev => ({
          ...prev,
          countdownPhase: phase,
          activationProgress: ((3 - phase) / 3) * 80,
        }));
      } else {
        if (countdownRef.current) clearInterval(countdownRef.current);

        setState(prev => ({ ...prev, countdownPhase: 0, activationProgress: 90 }));

        setTimeout(() => {
          const now = new Date().toISOString();

          setState(prev => {
            const newState = {
              isStealthMode: true,
              isTransitioning: false,
              networkBlocked: true,
              lastActivated: now,
              blockedRequests: 0,
              totalBlockedAllTime: prev.totalBlockedAllTime,
              countdownPhase: 0,
              activationProgress: 100,
              isLoading: false,
            };
            return newState;
          });

          // Sync activation to backend BEFORE network gets blocked
          syncToBackend(true, now, 0);
        }, 500);
      }
    }, 800);
  }, [syncToBackend]);

  const deactivateStealthMode = useCallback(() => {
    setState(prev => ({ ...prev, isTransitioning: true, activationProgress: 80 }));

    setTimeout(() => {
      setState(prev => ({ ...prev, activationProgress: 40 }));
    }, 300);

    setTimeout(() => {
      setState(prev => {
        const newTotal = prev.totalBlockedAllTime + prev.blockedRequests;
        // Sync deactivation to backend
        syncToBackend(false, prev.lastActivated, newTotal);

        return {
          isStealthMode: false,
          isTransitioning: false,
          networkBlocked: false,
          lastActivated: prev.lastActivated,
          blockedRequests: 0,
          totalBlockedAllTime: newTotal,
          countdownPhase: 0,
          activationProgress: 0,
          isLoading: false,
        };
      });
    }, 800);
  }, [syncToBackend]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return {
    ...state,
    activateStealthMode,
    deactivateStealthMode,
  };
};
