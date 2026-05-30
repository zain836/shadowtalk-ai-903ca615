import type { AIProvider } from "@/components/chat/ProviderSelector";
import type { AiProviderId } from "@/lib/aiProviders";
import {
  type CustomAiKeysConfig,
  type CustomAiProviderId,
  loadCustomAiConfig,
  hasActiveCustomKey,
} from "@/lib/customApiKeys";
import type { UserProviderKeyRow } from "@/hooks/useCustomApiKeys";

/** UI selector id → server-stored provider (user_provider_keys) */
export function toServerProvider(ui: AIProvider): AiProviderId | null {
  if (ui === "gemini") return "google";
  if (ui === "openrouter") return "openrouter";
  return null;
}

/** Server provider → UI selector id */
export function toUiProvider(server: AiProviderId): AIProvider | null {
  if (server === "google") return "gemini";
  if (server === "openrouter") return "openrouter";
  return null;
}

export function isByokProvider(provider: AIProvider): boolean {
  return provider !== "lovable";
}

export function hasStoredKeyForProvider(
  provider: AIProvider,
  keys: UserProviderKeyRow[],
  localConfig: CustomAiKeysConfig = loadCustomAiConfig(),
): boolean {
  if (provider === "lovable") return true;

  const serverId = toServerProvider(provider);
  if (
    serverId &&
    keys.some((k) => k.provider === serverId && k.verified_at && k.is_active)
  ) {
    return true;
  }

  return (
    !localConfig.usePlatformDefault &&
    localConfig.provider === provider &&
    hasActiveCustomKey(localConfig)
  );
}

export function resolveActiveUiProvider(
  keys: UserProviderKeyRow[],
  aiConfig: { useCustomKey: boolean; preferredProvider: AiProviderId | null },
  localConfig: CustomAiKeysConfig = loadCustomAiConfig(),
): AIProvider {
  if (aiConfig.useCustomKey && aiConfig.preferredProvider) {
    const ui = toUiProvider(aiConfig.preferredProvider);
    if (ui && hasStoredKeyForProvider(ui, keys, localConfig)) return ui;
  }

  if (!localConfig.usePlatformDefault && hasActiveCustomKey(localConfig)) {
    const p = localConfig.provider as AIProvider;
    if (p === "gemini" || p === "openrouter" || p === "kimi") return p;
  }

  const defaultKey = keys.find((k) => k.is_default && k.verified_at) || keys.find((k) => k.verified_at);
  if (defaultKey) {
    const ui = toUiProvider(defaultKey.provider as AiProviderId);
    if (ui) return ui;
  }

  return "lovable";
}

export function toCustomAiProviderId(provider: AIProvider): CustomAiProviderId {
  return provider as CustomAiProviderId;
}

/** Chat API body flags for the active UI provider */
export function buildChatProviderPayload(
  uiProvider: AIProvider,
  aiConfig: { useCustomKey: boolean; preferredProvider: AiProviderId | null },
  keys: UserProviderKeyRow[],
): Record<string, unknown> {
  if (uiProvider === "lovable") return {};

  const serverId = toServerProvider(uiProvider);
  if (
    serverId &&
    aiConfig.useCustomKey &&
    aiConfig.preferredProvider === serverId &&
    keys.some((k) => k.provider === serverId && k.verified_at && k.is_active)
  ) {
    return { useCustomApiKey: true, aiProvider: serverId };
  }

  return {};
}
