import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface StealthKillSwitchState {
  isStealthMode: boolean;
  isTransitioning: boolean;
  networkBlocked: boolean;
  lastActivated: string | null;
  blockedRequests: number;
  countdownPhase: number; // 0 = idle, 3/2/1 = countdown
  activationProgress: number; // 0-100
}

export const useStealthKillSwitch = () => {
  const { user } = useAuth();
  const blockedCountRef = useRef(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<StealthKillSwitchState>(() => {
    const saved = localStorage.getItem('shadowtalk_stealth_mode');
    return {
      isStealthMode: saved === 'true',
      isTransitioning: false,
      networkBlocked: saved === 'true',
      lastActivated: localStorage.getItem('shadowtalk_stealth_last_activated'),
      blockedRequests: 0,
      countdownPhase: 0,
      activationProgress: saved === 'true' ? 100 : 0,
    };
  });

  // Sync stealth mode preference to backend
  useEffect(() => {
    if (!user) return;
    const syncToBackend = async () => {
      try {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          setting_key: 'stealth_mode',
          setting_value: {
            isStealthMode: state.isStealthMode,
            lastActivated: state.lastActivated,
            totalBlocked: state.blockedRequests,
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,setting_key' });
      } catch { /* best-effort sync */ }
    };
    if (state.isStealthMode || state.lastActivated) {
      syncToBackend();
    }
  }, [state.isStealthMode, user]);

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

    // Dramatic 3-2-1 countdown
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

        // Final activation
        setState(prev => ({ ...prev, countdownPhase: 0, activationProgress: 90 }));

        setTimeout(() => {
          const now = new Date().toISOString();
          localStorage.setItem('shadowtalk_stealth_mode', 'true');
          localStorage.setItem('shadowtalk_stealth_last_activated', now);

          setState({
            isStealthMode: true,
            isTransitioning: false,
            networkBlocked: true,
            lastActivated: now,
            blockedRequests: 0,
            countdownPhase: 0,
            activationProgress: 100,
          });
        }, 500);
      }
    }, 800);
  }, []);

  const deactivateStealthMode = useCallback(() => {
    setState(prev => ({ ...prev, isTransitioning: true, activationProgress: 80 }));

    // Quick deactivation sequence
    setTimeout(() => {
      setState(prev => ({ ...prev, activationProgress: 40 }));
    }, 300);

    setTimeout(() => {
      localStorage.removeItem('shadowtalk_stealth_mode');

      setState(prev => ({
        isStealthMode: false,
        isTransitioning: false,
        networkBlocked: false,
        lastActivated: prev.lastActivated,
        blockedRequests: 0,
        countdownPhase: 0,
        activationProgress: 0,
      }));
    }, 800);
  }, []);

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
