import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import type { AiConfig, AiProviderId } from "@/lib/aiProviders";
import { DEFAULT_AI_CONFIG } from "@/lib/aiProviders";
import {
  type CustomAiProviderId,
  saveCustomAiConfig,
  loadCustomAiConfig,
  maskApiKey,
  DEFAULT_CUSTOM_AI_CONFIG,
} from "@/lib/customApiKeys";

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

function isInvokeUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg =
    "message" in error && typeof (error as { message: string }).message === "string"
      ? (error as { message: string }).message
      : String(error);
  return (
    msg.includes("Failed to send") ||
    msg.includes("Failed to fetch") ||
    msg.includes("FunctionsFetchError") ||
    msg.includes("Function not found") ||
    msg.includes("404")
  );
}

function toLocalProvider(provider: AiProviderId): CustomAiProviderId | null {
  if (provider === "google") return "gemini";
  if (provider === "openrouter") return "openrouter";
  return null;
}

async function invokeUserProviderKeys<T>(
  action: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("user-provider-keys", {
    body: { action, ...payload },
  });

  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as T;
}

async function verifyViaTestFunction(
  provider: AiProviderId,
  apiKey: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  const legacy = toLocalProvider(provider);
  const testProvider = legacy ?? provider;

  const { data, error } = await supabase.functions.invoke("test-custom-ai-key", {
    body: { provider: testProvider, apiKey: apiKey.trim() },
  });

  if (error) throw error;
  return data as { success: boolean; message?: string; error?: string };
}

export function useCustomApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<UserProviderKeyRow[]>([]);
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  const loadLocalKeys = useCallback((): UserProviderKeyRow[] => {
    const cfg = loadCustomAiConfig();
    if (cfg.usePlatformDefault || !cfg.apiKey?.trim()) return [];
    const provider = (cfg.provider === "gemini" ? "google" : cfg.provider) as AiProviderId;
    const now = new Date().toISOString();
    return [
      {
        id: `local-${provider}`,
        provider,
        label: "This device",
        key_prefix: maskApiKey(cfg.apiKey),
        verified_at: now,
        is_active: true,
        is_default: true,
        created_at: now,
        updated_at: now,
      },
    ];
  }, []);

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
    setUsingLocalFallback(false);
    try {
      const data = await invokeUserProviderKeys<{ keys: UserProviderKeyRow[] }>("list");
      setKeys(data.keys ?? []);
      await loadAiConfig();
    } catch (e) {
      console.warn("[useCustomApiKeys] server list unavailable, using local keys:", e);
      const local = loadLocalKeys();
      setKeys(local);
      setUsingLocalFallback(local.length > 0);
      if (local.length > 0) {
        setAiConfig((c) => ({
          ...c,
          preferredProvider: local[0].provider,
          useCustomKey: false,
        }));
      }
      await loadAiConfig();
    } finally {
      setIsLoading(false);
    }
  }, [user, loadAiConfig, loadLocalKeys]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveLocalFallback = useCallback(
    async (provider: AiProviderId, apiKey: string, label?: string) => {
      if (!user) return false;
      const localProvider = toLocalProvider(provider);
      if (localProvider) {
        saveCustomAiConfig({
          ...DEFAULT_CUSTOM_AI_CONFIG,
          provider: localProvider,
          apiKey: apiKey.trim(),
          usePlatformDefault: false,
          setupDismissed: true,
        });
      }

      await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          setting_key: "ai_config",
          setting_value: {
            preferredProvider: provider,
            useCustomKey: false,
            storage: "local",
            configuredAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,setting_key" },
      );

      setUsingLocalFallback(true);
      setKeys(loadLocalKeys());
      setAiConfig({
        preferredProvider: provider,
        useCustomKey: false,
        configuredAt: new Date().toISOString(),
      });

      toast({
        title: "API key configured",
        description: localProvider
          ? `${provider} is ready on this device. Chat will use your key via browser storage.`
          : `${provider} verified. Deploy the latest backend to sync keys across devices.`,
      });
      return true;
    },
    [user, loadLocalKeys, toast],
  );

  const verifyKey = useCallback(
    async (provider: AiProviderId, apiKey: string) => {
      setIsVerifying(true);
      try {
        try {
          const result = await invokeUserProviderKeys<{
            success: boolean;
            message?: string;
            error?: string;
          }>("verify", { provider, apiKey });
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
        } catch (serverErr) {
          if (!isInvokeUnavailable(serverErr)) throw serverErr;
          const result = await verifyViaTestFunction(provider, apiKey);
          if (!result?.success) {
            toast({
              title: "Verification failed",
              description: result?.error || result?.message || "Invalid API key",
              variant: "destructive",
            });
            return false;
          }
          toast({
            title: "Key verified",
            description: result.message || "Provider accepted your API key",
          });
          return true;
        }
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
        try {
          const result = await invokeUserProviderKeys<{
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
          setUsingLocalFallback(false);
          toast({
            title: "API key configured",
            description: `${provider} is ready. ShadowTalk will use your key for chat.`,
          });
          await refresh();
          return true;
        } catch (serverErr) {
          if (!isInvokeUnavailable(serverErr)) throw serverErr;
          const verified = await verifyViaTestFunction(provider, apiKey);
          if (!verified?.success) {
            toast({
              title: "Could not save key",
              description: verified?.error || "Invalid API key",
              variant: "destructive",
            });
            return false;
          }
          return saveLocalFallback(provider, apiKey, label);
        }
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
    [toast, refresh, saveLocalFallback],
  );

  const verifyAndSave = useCallback(
    async (provider: AiProviderId, apiKey: string, label?: string) => {
      return saveKey(provider, apiKey, label, true);
    },
    [saveKey],
  );

  const removeKey = useCallback(
    async (provider: AiProviderId) => {
      try {
        try {
          await invokeUserProviderKeys("delete", { provider });
        } catch (serverErr) {
          if (!isInvokeUnavailable(serverErr)) throw serverErr;
          saveCustomAiConfig({ ...DEFAULT_CUSTOM_AI_CONFIG });
        }
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
        try {
          await invokeUserProviderKeys("set-default", { provider });
        } catch (serverErr) {
          if (!isInvokeUnavailable(serverErr)) throw serverErr;
        }
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

  const hasVerifiedKey =
    keys.some((k) => k.verified_at && k.is_active) || loadLocalKeys().length > 0;
  const defaultKey = keys.find((k) => k.is_default) || keys.find((k) => k.verified_at);

  return {
    keys,
    aiConfig,
    isLoading,
    isVerifying,
    isSaving,
    hasVerifiedKey,
    defaultKey,
    usingLocalFallback,
    verifyKey,
    saveKey,
    verifyAndSave,
    removeKey,
    setDefault,
    refresh,
  };
}
