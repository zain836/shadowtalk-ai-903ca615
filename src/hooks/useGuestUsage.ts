import { useState, useEffect, useCallback } from 'react';

// Guest usage limits - more generous than ChatGPT!
export const GUEST_LIMITS = {
  chats: 10,          // ChatGPT gives ~5-10 for free
  images: 5,          // ChatGPT free = very limited
  deepResearch: 2,    // ChatGPT free = very limited
} as const;

interface GuestUsage {
  chats: number;
  images: number;
  deepResearch: number;
  createdAt: string;  // ISO date of first usage
  lastReset: string;  // ISO date of last reset
}

const STORAGE_KEY = 'shadowtalk-guest-usage';

// Get the current date in YYYY-MM-DD format (UTC to be consistent)
const getTodayKey = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getDefaultGuestUsage = (): GuestUsage => ({
  chats: 0,
  images: 0,
  deepResearch: 0,
  createdAt: new Date().toISOString(),
  lastReset: getTodayKey(),
});

export function useGuestUsage() {
  const [usage, setUsage] = useState<GuestUsage>(getDefaultGuestUsage);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load usage from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: GuestUsage = JSON.parse(stored);
        const today = getTodayKey();
        
        // Reset if it's a new day (but keep createdAt for overall tracking)
        if (parsed.lastReset !== today) {
          const fresh: GuestUsage = {
            ...getDefaultGuestUsage(),
            createdAt: parsed.createdAt, // Keep original creation date
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          setUsage(fresh);
        } else {
          setUsage(parsed);
        }
      } else {
        // First time user - initialize
        const fresh = getDefaultGuestUsage();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        setUsage(fresh);
      }
    } catch {
      const fresh = getDefaultGuestUsage();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setUsage(fresh);
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage whenever usage changes
  const persistUsage = useCallback((newUsage: GuestUsage) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
    setUsage(newUsage);
  }, []);

  // Check if guest can perform an action
  const canPerform = useCallback((action: keyof typeof GUEST_LIMITS): boolean => {
    return usage[action] < GUEST_LIMITS[action];
  }, [usage]);

  // Get remaining count for an action
  const getRemaining = useCallback((action: keyof typeof GUEST_LIMITS): number => {
    return Math.max(0, GUEST_LIMITS[action] - usage[action]);
  }, [usage]);

  // Track usage of an action
  const trackGuestAction = useCallback((action: keyof typeof GUEST_LIMITS, count: number = 1) => {
    const newUsage: GuestUsage = {
      ...usage,
      [action]: usage[action] + count,
    };
    persistUsage(newUsage);
    return newUsage[action] >= GUEST_LIMITS[action]; // Returns true if limit reached
  }, [usage, persistUsage]);

  // Check if guest should be prompted to sign in (limit reached)
  const shouldPromptSignIn = useCallback((action: keyof typeof GUEST_LIMITS): boolean => {
    return usage[action] >= GUEST_LIMITS[action];
  }, [usage]);

  // Check if all guest limits are exhausted
  const allLimitsExhausted = useCallback((): boolean => {
    return usage.chats >= GUEST_LIMITS.chats && 
           usage.images >= GUEST_LIMITS.images &&
           usage.deepResearch >= GUEST_LIMITS.deepResearch;
  }, [usage]);

  // Reset all guest usage (for testing or admin purposes)
  const resetGuestUsage = useCallback(() => {
    const fresh = getDefaultGuestUsage();
    persistUsage(fresh);
  }, [persistUsage]);

  return {
    usage,
    isLoaded,
    canPerform,
    getRemaining,
    trackGuestAction,
    shouldPromptSignIn,
    allLimitsExhausted,
    resetGuestUsage,
    limits: GUEST_LIMITS,
  };
}
