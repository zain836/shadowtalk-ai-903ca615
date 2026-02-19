import { useState, useCallback, useEffect } from 'react';

interface StealthKillSwitchState {
  isStealthMode: boolean;
  isTransitioning: boolean;
  networkBlocked: boolean;
  lastActivated: string | null;
}

export const useStealthKillSwitch = () => {
  const [state, setState] = useState<StealthKillSwitchState>(() => {
    const saved = localStorage.getItem('shadowtalk_stealth_mode');
    return {
      isStealthMode: saved === 'true',
      isTransitioning: false,
      networkBlocked: saved === 'true',
      lastActivated: localStorage.getItem('shadowtalk_stealth_last_activated'),
    };
  });

  // Block all fetch/XHR when stealth mode is active
  useEffect(() => {
    if (!state.isStealthMode) return;

    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;

    // Allow only local requests (blob:, data:, indexeddb operations)
    window.fetch = function (...args: Parameters<typeof fetch>) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
      const isLocal = url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('chrome-extension:');
      if (isLocal) return originalFetch.apply(this, args);
      
      console.warn('[StealthMode] Blocked network request:', url);
      return Promise.reject(new Error('[STEALTH MODE] All network requests are blocked. Disable stealth mode to restore connectivity.'));
    };

    XMLHttpRequest.prototype.open = function (...args: any) {
      const url = args[1] as string;
      const isLocal = url?.startsWith('blob:') || url?.startsWith('data:');
      if (isLocal) return originalXHROpen.apply(this, args);
      
      console.warn('[StealthMode] Blocked XHR request:', url);
      throw new Error('[STEALTH MODE] Network blocked');
    };

    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
    };
  }, [state.isStealthMode]);

  const activateStealthMode = useCallback(() => {
    setState(prev => ({ ...prev, isTransitioning: true }));
    
    // Small delay for visual transition
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
      
      console.log('[StealthMode] ⚡ ACTIVATED — All network traffic blocked');
    }, 500);
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
      
      console.log('[StealthMode] 🌐 DEACTIVATED — Network restored');
    }, 500);
  }, [state.lastActivated]);

  const toggleStealthMode = useCallback(() => {
    if (state.isStealthMode) {
      deactivateStealthMode();
    } else {
      activateStealthMode();
    }
  }, [state.isStealthMode, activateStealthMode, deactivateStealthMode]);

  return {
    ...state,
    activateStealthMode,
    deactivateStealthMode,
    toggleStealthMode,
  };
};
