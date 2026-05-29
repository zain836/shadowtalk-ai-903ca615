import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import type { AiConfig, AiProviderId } from "@/lib/aiProviders";
import { DEFAULT_AI_CONFIG } from "@/lib/aiProviders";

export interface UserProviderKeyRow {
  id: string;
  provider: AiProviderId;
  label: string | null;
  key_prefix: string;
  verified_at: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

async function invokeKeys<T>(action: string, body?: Record<string, unknown>): Promise<T> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Sign in required");

  const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-provider-keys`;
  const url = action === "list" ? `${base}?action=list` : `${base}?action=${action}`;

  const res = await fetch(url, {
    method: action === "list" ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: action === "list" ? undefined : JSON.stringify(body ?? {}),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json as T;
}

export function useCustomApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<UserProviderKeyRow[]>([]);
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadAiConfig = useCallback(async () => {
    if (!user) {
      setAiConfig(DEFAULT_AI_CONFIG);
      return;
    }
    const { data } = await supabase
      .from("user_settings")
      .select("setting_value")
      .eq("user_id", user.id)
      .eq("setting_key", "ai_config")
      .maybeSingle();

    if (data?.setting_value && typeof data.setting_value === "object") {
      setAiConfig({ ...DEFAULT_AI_CONFIG, ...(data.setting_value as AiConfig) });
    }
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setKeys([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { keys: rows } = await invokeKeys<{ keys: UserProviderKeyRow[] }>("list");
      setKeys(rows);
      await loadAiConfig();
    } catch (e) {
      console.error("[useCustomApiKeys] load failed", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadAiConfig]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verifyKey = useCallback(
    async (provider: AiProviderId, apiKey: string) => {
      setIsVerifying(true);
      try {
        const result = await invokeKeys<{ success: boolean; message?: string; error?: string }>(
          "verify",
          { provider, apiKey },
        );
        if (!result.success) {
          toast({
            title: "Verification failed",
            description: result.error || result.message || "Invalid API key",
            variant: "destructive",
          });
          return false;
        }
        toast({ title: "Key verified", description: result.message });
        return true;
      } catch (e) {
        toast({
          title: "Verification failed",
          description: e instanceof Error ? e.message : "Could not verify key",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [toast],
  );

  const saveKey = useCallback(
    async (provider: AiProviderId, apiKey: string, label?: string, setAsDefault = true) => {
      setIsSaving(true);
      try {
        const result = await invokeKeys<{
          success: boolean;
          message?: string;
          error?: string;
          key?: UserProviderKeyRow;
          configured?: AiConfig;
        }>("save", { provider, apiKey, label, setAsDefault });

        if (!result.success) {
          toast({
            title: "Could not save key",
            description: result.error || "Verification failed",
            variant: "destructive",
          });
          return false;
        }

        if (result.configured) setAiConfig(result.configured);
        toast({
          title: "API key configured",
          description: `${provider} is ready. ShadowTalk will use your key for chat.`,
        });
        await refresh();
        return true;
      } catch (e) {
        toast({
          title: "Save failed",
          description: e instanceof Error ? e.message : "Could not save API key",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [toast, refresh],
  );

  const verifyAndSave = useCallback(
    async (provider: AiProviderId, apiKey: string, label?: string) => {
      const ok = await verifyKey(provider, apiKey);
      if (!ok) return false;
      return saveKey(provider, apiKey, label, true);
    },
    [verifyKey, saveKey],
  );

  const removeKey = useCallback(
    async (provider: AiProviderId) => {
      try {
        await invokeKeys("delete", { provider });
        toast({ title: "API key removed" });
        await refresh();
      } catch (e) {
        toast({
          title: "Remove failed",
          description: e instanceof Error ? e.message : "Could not remove key",
          variant: "destructive",
        });
      }
    },
    [toast, refresh],
  );

  const setDefault = useCallback(
    async (provider: AiProviderId) => {
      try {
        await invokeKeys("set-default", { provider });
        setAiConfig((c) => ({ ...c, preferredProvider: provider, useCustomKey: true }));
        await refresh();
        toast({ title: "Default provider updated" });
      } catch (e) {
        toast({
          title: "Update failed",
          description: e instanceof Error ? e.message : "Could not set default",
          variant: "destructive",
        });
      }
    },
    [toast, refresh],
  );

  const hasVerifiedKey = keys.some((k) => k.verified_at && k.is_active);
  const defaultKey = keys.find((k) => k.is_default) || keys.find((k) => k.verified_at);

  return {
    keys,
    aiConfig,
    isLoading,
    isVerifying,
    isSaving,
    hasVerifiedKey,
    defaultKey,
    verifyKey,
    saveKey,
    verifyAndSave,
    removeKey,
    setDefault,
    refresh,
  };
}
