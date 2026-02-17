import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

/**
 * Server-side sync queue that persists operations to the DB
 * for cross-device sync and reliability.
 */
export const useServerSyncQueue = () => {
  const { user } = useAuth();

  const enqueue = useCallback(async (
    operationType: string,
    operationData: Record<string, unknown>,
    priority: number = 1
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('offline_sync_queue')
        .insert({
          user_id: user.id,
          operation_type: operationType,
          operation_data: operationData as any,
          priority,
          device_id: `${navigator.userAgent.slice(0, 50)}-${window.screen.width}`,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('[ServerSync] Enqueue failed:', err);
      return null;
    }
  }, [user]);

  const processQueue = useCallback(async () => {
    if (!user) return 0;

    try {
      const { data: pending, error } = await supabase
        .from('offline_sync_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      if (!pending?.length) return 0;

      let processed = 0;
      for (const item of pending) {
        try {
          await supabase
            .from('offline_sync_queue')
            .update({ status: 'completed', processed_at: new Date().toISOString() })
            .eq('id', item.id);
          processed++;
        } catch {
          const retries = (item.retry_count || 0) + 1;
          await supabase
            .from('offline_sync_queue')
            .update({
              status: retries >= item.max_retries ? 'failed' : 'pending',
              retry_count: retries,
              error_message: 'Processing failed',
            })
            .eq('id', item.id);
        }
      }
      return processed;
    } catch (err) {
      console.error('[ServerSync] Process failed:', err);
      return 0;
    }
  }, [user]);

  const getPendingCount = useCallback(async () => {
    if (!user) return 0;
    const { count } = await supabase
      .from('offline_sync_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending');
    return count || 0;
  }, [user]);

  return { enqueue, processQueue, getPendingCount };
};
