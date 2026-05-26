import type { ToolType } from "@/hooks/useToolOrchestrator";

export type ShadowToolOutcomeKind = "inline" | "ui" | "chat_flags" | "none";

export interface ShadowToolInlineResult {
  kind: "inline";
  tool: ToolType;
  content: string;
  imageUrl?: string;
}

export interface ShadowToolUIResult {
  kind: "ui";
  tool: ToolType;
  message: string;
  path?: string;
}

export interface ShadowToolChatFlagsResult {
  kind: "chat_flags";
  tool: ToolType;
  flags: Record<string, unknown>;
  preamble?: string;
}

export type ShadowToolResult = ShadowToolInlineResult | ShadowToolUIResult | ShadowToolChatFlagsResult;

export interface ExecuteShadowToolContext {
  accessToken?: string;
  personality: string;
  mode: string;
  attachment?: { type: string; data: string; mimeType: string };
}
