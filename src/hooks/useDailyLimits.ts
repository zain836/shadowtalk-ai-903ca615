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
  lastReset: string;
}

const STORAGE_KEY = 'shadowtalk-daily-usage';

const getDefaultUsage = (): DailyUsage => ({
  messages: 0,
  fileUploads: 0,
  codeGenerations: 0,
  imageGenerations: 0,
  webSearches: 0,
  lastReset: new Date().toDateString(),
});

export function useDailyLimits() {
  const { userPlan } = useAuth();
  const [usage, setUsage] = useState<DailyUsage>(getDefaultUsage);

  // Load usage from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: DailyUsage = JSON.parse(stored);
        const today = new Date().toDateString();
        
        // Reset if it's a new day
        if (parsed.lastReset !== today) {
          const fresh = getDefaultUsage();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          setUsage(fresh);
        } else {
          setUsage(parsed);
        }
      } catch {
        const fresh = getDefaultUsage();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        setUsage(fresh);
      }
    }
  }, []);

  // Get limit for current plan
  const getLimit = useCallback((action: ActionType): number => {
    const plan = userPlan as keyof typeof DAILY_LIMITS;
    return DAILY_LIMITS[plan]?.[action] ?? DAILY_LIMITS.free[action];
  }, [userPlan]);

  // Check if action is within limit
  const canPerform = useCallback((action: ActionType): boolean => {
    const limit = getLimit(action);
    if (limit === Infinity) return true;
    return usage[action] < limit;
  }, [usage, getLimit]);

  // Get remaining count for action
  const getRemaining = useCallback((action: ActionType): number => {
    const limit = getLimit(action);
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - usage[action]);
  }, [usage, getLimit]);

  // Get usage percentage
  const getPercentage = useCallback((action: ActionType): number => {
    const limit = getLimit(action);
    if (limit === Infinity) return 0;
    return Math.min((usage[action] / limit) * 100, 100);
  }, [usage, getLimit]);

  // Increment usage for an action
  const trackUsage = useCallback((action: ActionType, count: number = 1) => {
    setUsage(prev => {
      const updated = {
        ...prev,
        [action]: prev[action] + count,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
    getLimit,
    canPerform,
    getRemaining,
    getPercentage,
    trackUsage,
    resetUsage,
    isUnlimited: userPlan !== 'free',
  };
}
