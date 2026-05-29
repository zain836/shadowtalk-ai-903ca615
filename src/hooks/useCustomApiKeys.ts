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

const BACKEND_SETUP_MESSAGE =
  "Custom API keys backend is not available. Deploy the user-provider-keys edge function and run the user_provider_keys database migration on Supabase.";

function formatInvokeError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return error instanceof Error ? error.message : BACKEND_SETUP_MESSAGE;
}

async function invokeUserProviderKeys<T>(
  action: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("user-provider-keys", {
    body: { action, ...payload },
  });

  if (error) {
    throw new Error(formatInvokeError(error));
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (record.error) {
      throw new Error(String(record.error));
    }
  }

  return data as T;
}

export function useCustomApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<UserProviderKeyRow[]>([]);
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [backendReady, setBackendReady] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

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
      const cfg = data.setting_value as AiConfig & { storage?: string };
      if (cfg.storage === "local") {
        setAiConfig(DEFAULT_AI_CONFIG);
        return;
      }
      setAiConfig({ ...DEFAULT_AI_CONFIG, ...cfg });
    }
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setKeys([]);
      setBackendReady(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await invokeUserProviderKeys<{ keys: UserProviderKeyRow[] }>("list");
      setKeys(data.keys ?? []);
      setBackendReady(true);
      setBackendError(null);
      await loadAiConfig();
    } catch (e) {
      const message = e instanceof Error ? e.message : BACKEND_SETUP_MESSAGE;
      console.error("[useCustomApiKeys] backend unavailable:", message);
      setKeys([]);
      setBackendReady(false);
      setBackendError(message);
      setAiConfig(DEFAULT_AI_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadAiConfig]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verifyKey = useCallback(
    async (provider: AiProviderId, apiKey: string) => {
      if (!backendReady) {
        toast({
          title: "Backend not ready",
          description: BACKEND_SETUP_MESSAGE,
          variant: "destructive",
        });
        return false;
      }

      setIsVerifying(true);
      try {
        const result = await invokeUserProviderKeys<{
          success: boolean;
          message?: string;
          error?: string;
        }>("verify", { provider, apiKey: apiKey.trim() });

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
    [toast, backendReady],
  );

  const saveKey = useCallback(
    async (provider: AiProviderId, apiKey: string, label?: string, setAsDefault = true) => {
      if (!backendReady) {
        toast({
          title: "Cannot save key",
          description: BACKEND_SETUP_MESSAGE,
          variant: "destructive",
        });
        return false;
      }

      setIsSaving(true);
      try {
        const result = await invokeUserProviderKeys<{
          success: boolean;
          message?: string;
          error?: string;
          key?: UserProviderKeyRow;
          configured?: AiConfig;
        }>("save", {
          provider,
          apiKey: apiKey.trim(),
          label,
          setAsDefault,
        });

        if (!result.success) {
          toast({
            title: "Could not save key",
            description: result.error || result.message || "Verification failed",
            variant: "destructive",
          });
          return false;
        }

        if (!result.key?.verified_at) {
          toast({
            title: "Save incomplete",
            description: "Key was not stored with a verified status. Try again.",
            variant: "destructive",
          });
          return false;
        }

        if (result.configured) {
          setAiConfig(result.configured);
        }

        toast({
          title: "API key configured",
          description:
            result.message ||
            `${provider} is verified, encrypted on the server, and active for chat.`,
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
    [toast, refresh, backendReady],
  );

  const verifyAndSave = useCallback(
    async (provider: AiProviderId, apiKey: string, label?: string) => {
      return saveKey(provider, apiKey, label, true);
    },
    [saveKey],
  );

  const removeKey = useCallback(
    async (provider: AiProviderId) => {
      if (!backendReady) {
        toast({
          title: "Cannot remove key",
          description: BACKEND_SETUP_MESSAGE,
          variant: "destructive",
        });
        return;
      }

      try {
        await invokeUserProviderKeys("delete", { provider });
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
    [toast, refresh, backendReady],
  );

  const setDefault = useCallback(
    async (provider: AiProviderId) => {
      if (!backendReady) {
        toast({
          title: "Cannot update default",
          description: BACKEND_SETUP_MESSAGE,
          variant: "destructive",
        });
        return;
      }

      try {
        await invokeUserProviderKeys("set-default", { provider });
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
    [toast, refresh, backendReady],
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
    backendReady,
    backendError,
    verifyKey,
    saveKey,
    verifyAndSave,
    removeKey,
    setDefault,
    refresh,
  };
}
