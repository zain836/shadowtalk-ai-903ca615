import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export const useKnowledgeSnapshot = () => {
  const { user } = useAuth();

  const saveSnapshot = useCallback(async (
    entities: unknown[],
    relationships: unknown[]
  ) => {
    if (!user) return false;

    const snapshotData = { entities, relationships };
    const raw = JSON.stringify(snapshotData);
    // Simple checksum via hash of length + content sample
    const checksum = `v1-${raw.length}-${raw.slice(0, 64)}`;

    try {
      await supabase.from('knowledge_snapshots').insert({
        user_id: user.id,
        snapshot_data: snapshotData as any,
        entity_count: entities.length,
        relationship_count: relationships.length,
        checksum,
      });
      return true;
    } catch (err) {
      console.error('[KnowledgeSnapshot] Save failed:', err);
      return false;
    }
  }, [user]);

  const loadLatestSnapshot = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('knowledge_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[KnowledgeSnapshot] Load failed:', err);
      return null;
    }
  }, [user]);

  return { saveSnapshot, loadLatestSnapshot };
};
