import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export type MemoryCategory = 'profile' | 'voice' | 'customers' | 'facts';

export interface BusinessMemory {
  id: string;
  user_id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryFormData {
  category: MemoryCategory;
  title: string;
  content: string;
  priority?: number;
}

export const MEMORY_CATEGORIES: { id: MemoryCategory; label: string; description: string; icon: string }[] = [
  { id: 'profile', label: 'Business Profile', description: 'Company name, industry, mission, values, products/services', icon: '🏢' },
  { id: 'voice', label: 'Brand Voice', description: 'Tone, style, key phrases, terminology to use/avoid', icon: '🎤' },
  { id: 'customers', label: 'Customer Context', description: 'Target audience, pain points, FAQs, common objections', icon: '👥' },
  { id: 'facts', label: 'Custom Facts', description: 'Free-form facts and notes the AI should know', icon: '📝' },
];

export function useBusinessMemory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [memories, setMemories] = useState<BusinessMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMemories = useCallback(async () => {
    if (!user) {
      setMemories([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('business_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion since the table is new and types aren't regenerated yet
      setMemories((data || []) as unknown as BusinessMemory[]);
    } catch (error) {
      console.error('Error fetching business memories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business memories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMemories();

    // Subscribe to realtime changes
    if (user) {
      const channel = supabase
        .channel('business_memories_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'business_memories',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchMemories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchMemories]);

  const addMemory = async (data: MemoryFormData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to save business memories',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_memories')
        .insert({
          user_id: user.id,
          category: data.category,
          title: data.title,
          content: data.content,
          priority: data.priority || 0,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Memory Saved',
        description: 'Your business memory has been saved',
      });

      await fetchMemories();
      return true;
    } catch (error) {
      console.error('Error adding memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to save memory',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateMemory = async (id: string, data: Partial<MemoryFormData & { is_active: boolean }>): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_memories')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Memory Updated',
        description: 'Your business memory has been updated',
      });

      await fetchMemories();
      return true;
    } catch (error) {
      console.error('Error updating memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to update memory',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteMemory = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('business_memories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Memory Deleted',
        description: 'Your business memory has been deleted',
      });

      await fetchMemories();
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete memory',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleMemory = async (id: string): Promise<boolean> => {
    const memory = memories.find(m => m.id === id);
    if (!memory) return false;
    return updateMemory(id, { is_active: !memory.is_active });
  };

  const getActiveMemories = useCallback((): BusinessMemory[] => {
    return memories.filter(m => m.is_active);
  }, [memories]);

  const getMemoriesByCategory = useCallback((category: MemoryCategory): BusinessMemory[] => {
    return memories.filter(m => m.category === category);
  }, [memories]);

  const getMemoryContext = useCallback((): string => {
    const activeMemories = getActiveMemories();
    if (activeMemories.length === 0) return '';

    const sections: string[] = [];

    for (const category of MEMORY_CATEGORIES) {
      const categoryMemories = activeMemories.filter(m => m.category === category.id);
      if (categoryMemories.length > 0) {
        sections.push(`### ${category.label}\n${categoryMemories.map(m => `- **${m.title}**: ${m.content}`).join('\n')}`);
      }
    }

    return `## BUSINESS MEMORY (Use this context to personalize responses)\n\n${sections.join('\n\n')}`;
  }, [getActiveMemories]);

  return {
    memories,
    loading,
    saving,
    addMemory,
    updateMemory,
    deleteMemory,
    toggleMemory,
    getActiveMemories,
    getMemoriesByCategory,
    getMemoryContext,
    refetch: fetchMemories,
  };
}
