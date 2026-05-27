/**
 * Bring-your-own-key (BYOK) configuration — stored locally on the device.
 * Keys are sent to edge functions per request and are not persisted on ShadowTalk servers.
 */

export type CustomAiProviderId = "lovable" | "gemini" | "openrouter" | "kimi";

export type CustomAiKeysConfig = {
  /** Active provider for cloud AI calls */
  provider: CustomAiProviderId;
  /** Raw API key (never logged) */
  apiKey: string;
  /** Optional model override (provider-specific id) */
  model?: string;
  /** User chose ShadowTalk default (no BYOK) */
  usePlatformDefault: boolean;
  /** User closed setup without adding a key */
  setupDismissed: boolean;
};

export const CUSTOM_AI_STORAGE_KEY = "shadowtalk_custom_ai_keys";

export const AI_PROVIDER_OPTIONS: {
  id: CustomAiProviderId;
  label: string;
  description: string;
  keyPlaceholder: string;
  keyHint: string;
  defaultModel: string;
  docsUrl: string;
}[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    description: "Use your Google AI Studio API key",
    keyPlaceholder: "AIza...",
    keyHint: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-2.0-flash",
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Access 100+ models (Gemini, Claude, Llama, Kimi, …) with one key",
    keyPlaceholder: "sk-or-v1-...",
    keyHint: "https://openrouter.ai/keys",
    defaultModel: "google/gemini-2.0-flash-001",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "kimi",
    label: "Kimi (Moonshot)",
    description: "Moonshot / Kimi API for Kimi-class models",
    keyPlaceholder: "sk-...",
    keyHint: "https://platform.moonshot.cn/console/api-keys",
    defaultModel: "moonshot-v1-8k",
    docsUrl: "https://platform.moonshot.cn/docs",
  },
  {
    id: "lovable",
    label: "ShadowTalk Pro (platform)",
    description: "Use built-in ShadowTalk cloud AI (subscription / platform credits)",
    keyPlaceholder: "",
    keyHint: "",
    defaultModel: "google/gemini-2.5-flash",
    docsUrl: "",
  },
];

export const DEFAULT_CUSTOM_AI_CONFIG: CustomAiKeysConfig = {
  provider: "openrouter",
  apiKey: "",
  model: "",
  usePlatformDefault: true,
  setupDismissed: false,
};

export function loadCustomAiConfig(): CustomAiKeysConfig {
  try {
    const raw = localStorage.getItem(CUSTOM_AI_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CUSTOM_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<CustomAiKeysConfig>;
    return {
      ...DEFAULT_CUSTOM_AI_CONFIG,
      ...parsed,
      provider: (parsed.provider as CustomAiProviderId) || DEFAULT_CUSTOM_AI_CONFIG.provider,
    };
  } catch {
    return { ...DEFAULT_CUSTOM_AI_CONFIG };
  }
}

export function saveCustomAiConfig(config: CustomAiKeysConfig): void {
  localStorage.setItem(CUSTOM_AI_STORAGE_KEY, JSON.stringify(config));
}

/** Payload fragment for Supabase edge functions */
export function getCustomAiRequestPayload(config: CustomAiKeysConfig): Record<string, unknown> | undefined {
  if (config.usePlatformDefault || !config.apiKey?.trim()) return undefined;
  return {
    customAi: {
      provider: config.provider,
      apiKey: config.apiKey.trim(),
      model: config.model?.trim() || undefined,
    },
  };
}

export function mergeChatRequestBody(
  base: Record<string, unknown>,
  config: CustomAiKeysConfig,
): Record<string, unknown> {
  const custom = getCustomAiRequestPayload(config);
  return custom ? { ...base, ...custom } : base;
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "••••";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export function hasActiveCustomKey(config: CustomAiKeysConfig): boolean {
  return !config.usePlatformDefault && config.apiKey.trim().length >= 10;
}

export function shouldShowApiKeysSetup(config: CustomAiKeysConfig): boolean {
  if (config.setupDismissed || hasActiveCustomKey(config)) return false;
  return true;
}
