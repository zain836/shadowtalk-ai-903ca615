import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureGating, PlanTier } from './useFeatureGating';

// =============================================================================
// Mission Quota System - Industry-Benchmarked Limits
// Based on 2026 freelancer studies: 3-5 high-reliability missions preferred
// Hybrid billing: 3 free retries per mission before counting
// =============================================================================

export const MISSION_LIMITS: Record<PlanTier, number> = {
  free: 3,
  pro: 15,
  premium: 15,
  lifetime: 30,
  elite: 50,
  enterprise: Infinity,
};

export const MAX_FREE_RETRIES = 3;
export const MISSION_STEP_TIMEOUT_MS = 30 * 60 * 1000; // 30-min ceiling per step

export interface MissionQuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  plan: PlanTier;
  resetDate: string; // first of next month
}

export const useMissionQuota = () => {
  const { userPlan, hasSpecialAccess } = useFeatureGating();
  const [quotaInfo, setQuotaInfo] = useState<MissionQuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  };

  const getNextMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  };

  const fetchQuota = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count missions this month that were marked as "completed" by user (success-fee)
      // Failed/cancelled missions with retry_count < MAX_FREE_RETRIES don't count
      const monthStart = getMonthStart();
      
      const { count, error } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart)
        .in('status', ['completed', 'running', 'queued'])
        .or(`status.eq.completed,and(status.in.(failed),retry_count.gte.${MAX_FREE_RETRIES})`);

      if (error) throw error;

      const plan = (hasSpecialAccess ? 'enterprise' : userPlan) as PlanTier;
      const limit = MISSION_LIMITS[plan] ?? MISSION_LIMITS.free;
      const used = count || 0;

      setQuotaInfo({
        used,
        limit,
        remaining: Math.max(0, limit - used),
        plan,
        resetDate: getNextMonthStart(),
      });
    } catch (error) {
      console.error('Error fetching mission quota:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userPlan, hasSpecialAccess]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const canCreateMission = quotaInfo ? quotaInfo.remaining > 0 : false;

  const consumeMission = useCallback(async () => {
    await fetchQuota(); // Refresh after consumption
  }, [fetchQuota]);

  return {
    quotaInfo,
    isLoading,
    canCreateMission,
    consumeMission,
    refreshQuota: fetchQuota,
    maxRetries: MAX_FREE_RETRIES,
    stepTimeoutMs: MISSION_STEP_TIMEOUT_MS,
  };
};
