import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

const SPECIAL_ACCESS_EMAILS = ['j3451500@gmail.com', 'almadadali00@gmail.com'];

export function useStrategyAccess() {
  const { user } = useAuth();
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [hasActiveDayPass, setHasActiveDayPass] = useState(false);
  const [loading, setLoading] = useState(true);

  const FREE_REPORTS_PER_MONTH = 1;
  const isSpecialAccess = SPECIAL_ACCESS_EMAILS.some(e => e.toLowerCase() === user?.email?.toLowerCase());

  const checkAccess = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check monthly usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error: usageError } = await supabase
        .from('strategy_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('used_at', startOfMonth.toISOString());

      if (usageError) throw usageError;
      setMonthlyUsage(count || 0);

      // Check for active day pass
      const { data: passes, error: passError } = await supabase
        .from('strategy_day_passes')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('valid_until', new Date().toISOString())
        .limit(1);

      if (passError) throw passError;
      setHasActiveDayPass((passes?.length || 0) > 0);
    } catch (err) {
      console.error('Error checking strategy access:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const canUseStrategy = (): boolean => {
    if (!user) return false;
    if (isSpecialAccess) return true;
    if (hasActiveDayPass) return true;
    if (monthlyUsage < FREE_REPORTS_PER_MONTH) return true;
    return false;
  };

  const recordUsage = async (businessName: string, industry: string) => {
    if (!user) return;
    await supabase.from('strategy_usage').insert({
      user_id: user.id,
      business_name: businessName,
      industry,
    });
    setMonthlyUsage(prev => prev + 1);
  };

  const remainingFree = Math.max(0, FREE_REPORTS_PER_MONTH - monthlyUsage);

  return {
    canUseStrategy: canUseStrategy(),
    hasActiveDayPass,
    monthlyUsage,
    remainingFree,
    loading,
    recordUsage,
    refreshAccess: checkAccess,
    FREE_REPORTS_PER_MONTH,
  };
}
