import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export function useStrategyAccess() {
  const { user } = useAuth();
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  const FREE_REPORTS_PER_MONTH = Infinity; // Unlimited — no paywall

  const checkAccess = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
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
    } catch (err) {
      console.error('Error checking strategy access:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const recordUsage = async (businessName: string, industry: string) => {
    if (!user) return;
    await supabase.from('strategy_usage').insert({
      user_id: user.id,
      business_name: businessName,
      industry,
    });
    setMonthlyUsage(prev => prev + 1);
  };

  const remainingFree = Infinity;

  return {
    canUseStrategy: !!user, // Always allowed if logged in
    hasActiveDayPass: true, // No paywall needed
    monthlyUsage,
    remainingFree,
    loading,
    recordUsage,
    refreshAccess: checkAccess,
    FREE_REPORTS_PER_MONTH,
  };
}
