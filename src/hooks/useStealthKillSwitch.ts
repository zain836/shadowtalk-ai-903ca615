import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface StealthKillSwitchState {
  isStealthMode: boolean;
  isTransitioning: boolean;
  networkBlocked: boolean;
  lastActivated: string | null;
}

export const useStealthKillSwitch = () => {
  const { user } = useAuth();
  const [state, setState] = useState<StealthKillSwitchState>(() => {
    const saved = localStorage.getItem('shadowtalk_stealth_mode');
    return {
      isStealthMode: saved === 'true',
      isTransitioning: false,
      networkBlocked: saved === 'true',
      lastActivated: localStorage.getItem('shadowtalk_stealth_last_activated'),
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
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,setting_key' });
      } catch { /* best-effort sync */ }
    };
    // Only sync when stealth state changes (not on mount)
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
      console.log('[StealthMode] Blocked fetch:', url);
      return Promise.reject(new Error('Network blocked by Stealth Mode'));
    };

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.startsWith('blob:') || urlStr.startsWith('data:') || urlStr.includes('localhost')) {
        return originalXHROpen.apply(this, [method, url, ...rest] as any);
      }
      console.log('[StealthMode] Blocked XHR:', urlStr);
      throw new Error('Network blocked by Stealth Mode');
    };

    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
    };
  }, [state.isStealthMode]);

  const activateStealthMode = useCallback(() => {
    setState(prev => ({ ...prev, isTransitioning: true }));
    
    setTimeout(() => {
      const now = new Date().toISOString();
      localStorage.setItem('shadowtalk_stealth_mode', 'true');
      localStorage.setItem('shadowtalk_stealth_last_activated', now);
      
      setState({
        isStealthMode: true,
        isTransitioning: false,
        networkBlocked: true,
        lastActivated: now,
      });
    }, 1500);
  }, []);

  const deactivateStealthMode = useCallback(() => {
    setState(prev => ({ ...prev, isTransitioning: true }));
    
    setTimeout(() => {
      localStorage.removeItem('shadowtalk_stealth_mode');
      
      setState({
        isStealthMode: false,
        isTransitioning: false,
        networkBlocked: false,
        lastActivated: state.lastActivated,
      });
    }, 1000);
  }, [state.lastActivated]);

  return {
    ...state,
    activateStealthMode,
    deactivateStealthMode,
  };
};
