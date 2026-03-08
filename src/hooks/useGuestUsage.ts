import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const GUEST_LIMITS = {
  chats: 10,
  images: 5,
  deepResearch: 2,
} as const;

interface GuestUsage {
  chats: number;
  images: number;
  deepResearch: number;
  createdAt: string;
  lastReset: string;
}

const STORAGE_KEY = 'shadowtalk-guest-usage';

const getTodayKey = (): string => new Date().toISOString().split('T')[0];

const getSessionId = (): string => {
  let sid = localStorage.getItem('shadowtalk-guest-session-id');
  if (!sid) {
    sid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('shadowtalk-guest-session-id', sid);
  }
  return sid;
};

const getDefaultGuestUsage = (): GuestUsage => ({
  chats: 0,
  images: 0,
  deepResearch: 0,
  createdAt: new Date().toISOString(),
  lastReset: getTodayKey(),
});

const DB_TO_LOCAL_MAP: Record<string, keyof GuestUsage> = {
  chats: 'chats',
  images: 'images',
  deep_research: 'deepResearch',
};

export function useGuestUsage() {
  const [usage, setUsage] = useState<GuestUsage>(getDefaultGuestUsage);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from backend first, fallback to localStorage
  useEffect(() => {
    const load = async () => {
      const sessionId = getSessionId();
      const today = getTodayKey();

      try {
        const { data } = await supabase
          .from('guest_usage')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (data) {
          const needsReset = data.last_reset !== today;
          const loaded: GuestUsage = needsReset
            ? { ...getDefaultGuestUsage(), createdAt: data.created_at }
            : {
                chats: data.chats,
                images: data.images,
                deepResearch: data.deep_research,
                createdAt: data.created_at,
                lastReset: data.last_reset,
              };

          if (needsReset) {
            await supabase
              .from('guest_usage')
              .update({ chats: 0, images: 0, deep_research: 0, last_reset: today })
              .eq('session_id', sessionId);
          }

          localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
          setUsage(loaded);
        } else {
          // Try localStorage migration
          const stored = localStorage.getItem(STORAGE_KEY);
          const fresh = stored ? JSON.parse(stored) : getDefaultGuestUsage();
          
          if (stored && fresh.lastReset !== today) {
            Object.assign(fresh, getDefaultGuestUsage(), { createdAt: fresh.createdAt });
          }

          // Insert into backend
          await supabase.from('guest_usage').insert({
            session_id: sessionId,
            chats: fresh.chats,
            images: fresh.images,
            deep_research: fresh.deepResearch,
            last_reset: fresh.lastReset || today,
          });

          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          setUsage(fresh);
        }
      } catch {
        // Fallback to localStorage only
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setUsage(JSON.parse(stored));
        } else {
          const fresh = getDefaultGuestUsage();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          setUsage(fresh);
        }
      }
      setIsLoaded(true);
    };

    load();
  }, []);

  const persistUsage = useCallback((newUsage: GuestUsage) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
    setUsage(newUsage);

    // Sync to backend
    const sessionId = getSessionId();
    supabase
      .from('guest_usage')
      .update({
        chats: newUsage.chats,
        images: newUsage.images,
        deep_research: newUsage.deepResearch,
      })
      .eq('session_id', sessionId)
      .then(() => {});
  }, []);

  const canPerform = useCallback((action: keyof typeof GUEST_LIMITS): boolean => {
    return usage[action] < GUEST_LIMITS[action];
  }, [usage]);

  const getRemaining = useCallback((action: keyof typeof GUEST_LIMITS): number => {
    return Math.max(0, GUEST_LIMITS[action] - usage[action]);
  }, [usage]);

  const trackGuestAction = useCallback((action: keyof typeof GUEST_LIMITS, count: number = 1) => {
    const newUsage: GuestUsage = {
      ...usage,
      [action]: usage[action] + count,
    };
    persistUsage(newUsage);
    return newUsage[action] >= GUEST_LIMITS[action];
  }, [usage, persistUsage]);

  const shouldPromptSignIn = useCallback((action: keyof typeof GUEST_LIMITS): boolean => {
    return usage[action] >= GUEST_LIMITS[action];
  }, [usage]);

  const allLimitsExhausted = useCallback((): boolean => {
    return usage.chats >= GUEST_LIMITS.chats &&
           usage.images >= GUEST_LIMITS.images &&
           usage.deepResearch >= GUEST_LIMITS.deepResearch;
  }, [usage]);

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
