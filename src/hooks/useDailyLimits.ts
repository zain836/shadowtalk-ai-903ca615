import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { DAILY_LIMITS } from '@/lib/monetization';

type ActionType = keyof typeof DAILY_LIMITS.free;

interface DailyUsage {
  messages: number;
  fileUploads: number;
  codeGenerations: number;
  imageGenerations: number;
  webSearches: number;
  deepResearch: number;
  lastResetDate: string; // YYYY-MM-DD format for reliable comparison
}

const STORAGE_KEY = 'shadowtalk-daily-usage-v2'; // v2 to force migration

// Get today's date in YYYY-MM-DD format (UTC for consistency)
const getTodayKey = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getDefaultUsage = (): DailyUsage => ({
  messages: 0,
  fileUploads: 0,
  codeGenerations: 0,
  imageGenerations: 0,
  webSearches: 0,
  deepResearch: 0,
  lastResetDate: getTodayKey(),
});

export function useDailyLimits() {
  const { userPlan } = useAuth();
  const [usage, setUsage] = useState<DailyUsage>(getDefaultUsage);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load usage from localStorage with proper date check
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const today = getTodayKey();
      
      if (stored) {
        const parsed: DailyUsage = JSON.parse(stored);
        
        // Reset if it's a new day - use proper date comparison
        if (parsed.lastResetDate !== today) {
          console.log('[DailyLimits] New day detected, resetting usage');
          const fresh = getDefaultUsage();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          setUsage(fresh);
        } else {
          console.log('[DailyLimits] Loaded existing usage:', parsed);
          setUsage(parsed);
        }
      } else {
        // First time - initialize
        const fresh = getDefaultUsage();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        setUsage(fresh);
      }
    } catch (e) {
      console.error('[DailyLimits] Error loading usage:', e);
      const fresh = getDefaultUsage();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setUsage(fresh);
    }
    setIsLoaded(true);
  }, []);

  // Get limit for current plan
  const getLimit = useCallback((action: ActionType): number => {
    const plan = userPlan as keyof typeof DAILY_LIMITS;
    const limits = DAILY_LIMITS[plan] ?? DAILY_LIMITS.free;
    return (limits as Record<string, number>)[action] ?? 0;
  }, [userPlan]);

  // Check if action is within limit
  const canPerform = useCallback((action: ActionType): boolean => {
    const limit = getLimit(action);
    if (limit === Infinity) return true;
    const current = usage[action as keyof DailyUsage] as number ?? 0;
    return current < limit;
  }, [usage, getLimit]);

  // Get remaining count for action
  const getRemaining = useCallback((action: ActionType): number => {
    const limit = getLimit(action);
    if (limit === Infinity) return Infinity;
    const current = usage[action as keyof DailyUsage] as number ?? 0;
    return Math.max(0, limit - current);
  }, [usage, getLimit]);

  // Get usage percentage
  const getPercentage = useCallback((action: ActionType): number => {
    const limit = getLimit(action);
    if (limit === Infinity) return 0;
    const current = usage[action as keyof DailyUsage] as number ?? 0;
    return Math.min((current / limit) * 100, 100);
  }, [usage, getLimit]);

  // Increment usage for an action - PERSISTS TO LOCALSTORAGE
  const trackUsage = useCallback((action: ActionType, count: number = 1) => {
    setUsage(prev => {
      const currentValue = prev[action as keyof DailyUsage];
      const newValue = typeof currentValue === 'number' ? currentValue + count : count;
      const updated: DailyUsage = {
        ...prev,
        [action]: newValue,
      };
      // Immediately persist to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('[DailyLimits] Updated usage:', action, updated);
      return updated;
    });
  }, []);

  // Reset all usage (for testing or manual reset)
  const resetUsage = useCallback(() => {
    const fresh = getDefaultUsage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setUsage(fresh);
  }, []);

  return {
    usage,
    isLoaded,
    getLimit,
    canPerform,
    getRemaining,
    getPercentage,
    trackUsage,
    resetUsage,
    isUnlimited: userPlan !== 'free',
  };
}
