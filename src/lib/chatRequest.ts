import { loadCustomAiConfig, mergeChatRequestBody } from "@/lib/customApiKeys";

/** Attach BYOK customAi payload to any edge-function request body */
export function buildChatRequestBody(base: Record<string, unknown>): Record<string, unknown> {
  return mergeChatRequestBody(base, loadCustomAiConfig());
}

/** JSON body for chat / document / presentation edge functions (includes BYOK when configured) */
export function stringifyChatBody(base: Record<string, unknown>): string {
  return JSON.stringify(buildChatRequestBody(base));
}
