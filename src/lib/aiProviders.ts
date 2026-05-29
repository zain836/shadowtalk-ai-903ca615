export type AiProviderId =
  | "google"
  | "openai"
  | "anthropic"
  | "xai"
  | "perplexity"
  | "openrouter"
  | "mistral"
  | "groq";

export interface AiProviderOption {
  id: AiProviderId;
  name: string;
  description: string;
  keyPlaceholder: string;
  docsUrl: string;
}

export const AI_PROVIDER_OPTIONS: AiProviderOption[] = [
  {
    id: "google",
    name: "Google Gemini",
    description: "Gemini models via Google AI Studio",
    keyPlaceholder: "AIza…",
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o and ChatGPT API",
    keyPlaceholder: "sk-…",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models",
    keyPlaceholder: "sk-ant-…",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Unified access to many models",
    keyPlaceholder: "sk-or-…",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Search-augmented answers",
    keyPlaceholder: "pplx-…",
    docsUrl: "https://www.perplexity.ai/settings/api",
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    description: "Grok models",
    keyPlaceholder: "xai-…",
    docsUrl: "https://console.x.ai/",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Mistral and Codestral",
    keyPlaceholder: "…",
    docsUrl: "https://console.mistral.ai/api-keys/",
  },
  {
    id: "groq",
    name: "Groq",
    description: "Fast inference for open models",
    keyPlaceholder: "gsk_…",
    docsUrl: "https://console.groq.com/keys",
  },
];

export interface AiConfig {
  preferredProvider: AiProviderId | null;
  useCustomKey: boolean;
  configuredAt?: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  preferredProvider: null,
  useCustomKey: false,
};
