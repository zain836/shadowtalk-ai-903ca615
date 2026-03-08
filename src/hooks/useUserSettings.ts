import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export function useUserSettings<T = any>(settingKey: string, defaultValue: T) {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load from DB, fallback to localStorage
  useEffect(() => {
    if (!user) {
      // For unauthenticated users, use localStorage
      try {
        const stored = localStorage.getItem(`shadowtalk_${settingKey}`);
        if (stored) setValue(JSON.parse(stored));
      } catch { /* ignore */ }
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', settingKey)
          .maybeSingle();

        if (data && !error) {
          setValue(data.setting_value as T);
        } else {
          // Migrate from localStorage if exists
          const stored = localStorage.getItem(`shadowtalk_${settingKey}`) 
            || localStorage.getItem(`${settingKey}_${user.id}`)
            || localStorage.getItem(`custom_instructions_${user.id}`);
          if (stored && settingKey === 'custom_instructions') {
            const parsed = JSON.parse(stored);
            setValue(parsed as T);
            // Save to DB
            await supabase.from('user_settings').upsert({
              user_id: user.id,
              setting_key: settingKey,
              setting_value: parsed,
            }, { onConflict: 'user_id,setting_key' });
          }
        }
      } catch (e) {
        console.error(`[UserSettings] Failed to load ${settingKey}:`, e);
      }
      setIsLoading(false);
    };

    load();
  }, [user, settingKey]);

  const save = useCallback(async (newValue: T) => {
    setValue(newValue);
    
    if (!user) {
      localStorage.setItem(`shadowtalk_${settingKey}`, JSON.stringify(newValue));
      return;
    }

    setIsSaving(true);
    try {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        setting_key: settingKey,
        setting_value: newValue as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,setting_key' });
    } catch (e) {
      console.error(`[UserSettings] Failed to save ${settingKey}:`, e);
      // Fallback to localStorage
      localStorage.setItem(`shadowtalk_${settingKey}`, JSON.stringify(newValue));
    }
    setIsSaving(false);
  }, [user, settingKey]);

  return { value, save, isLoading, isSaving };
}
