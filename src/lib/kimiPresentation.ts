import { buildChatRequestBody , stringifyChatBody} from "@/lib/chatRequest";
import { supabase } from "@/integrations/supabase/client";
import type { PresentationData } from "@/components/presentation/types";
import type { ThemeKey } from "@/components/presentation/types";

export type KimiPresentationMode = "adaptive" | "visual";

export const KIMI_PRESENTATION_MODES: { value: KimiPresentationMode; label: string; description: string }[] = [
  {
    value: "adaptive",
    label: "Adaptive",
    description: "Deep research, citations, data-heavy decks (Kimi default)",
  },
  {
    value: "visual",
    label: "Visual",
    description: "Designer-quality visuals, bold layouts, faster polish",
  },
];

export const PRESENTATION_SESSION_KEY = "shadowtalk_presentation_payload";

export interface GeneratePresentationOptions {
  topic: string;
  slideCount?: number;
  style?: ThemeKey;
  mode?: KimiPresentationMode;
  additionalContext?: string;
  sourceDocument?: string;
}

export function extractPresentationTopic(message: string): string {
  return message
    .replace(
      /^(?:please\s+)?(?:create|make|build|generate|design|draft)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:\d+\s*-?\s*slide\s+)?(?:professional\s+)?(?:presentation|ppt|pptx|slides?|slide\s*deck|deck|powerpoint|pitch\s*deck)\s*(?:about|on|for|regarding)?\s*/i,
      ""
    )
    .trim() || message;
}

export function inferPresentationMode(message: string): KimiPresentationMode {
  if (/\b(visual|beautiful|designer|keynote|marketing|brand)\b/i.test(message)) return "visual";
  return "adaptive";
}

export async function generateKimiPresentation(
  options: GeneratePresentationOptions
): Promise<PresentationData> {
  const { topic, slideCount = 10, style = "corporate", mode = "adaptive", additionalContext, sourceDocument } = options;

  const { data, error } = await supabase.functions.invoke("generate-presentation", {
    body: buildChatRequestBody({
      topic,
      slideCount,
      style,
      mode,
      additionalContext,
      sourceDocument,
    }),
  });

  if (error) {
    const errMsg = data?.error || (error instanceof Error ? error.message : "Generation failed");
    throw new Error(errMsg);
  }
  if (data?.error) throw new Error(data.error);
  if (!data?.slides?.length) throw new Error("No slides were generated. Try again.");

  return data as PresentationData;
}

export function savePresentationToSession(presentation: PresentationData, style: ThemeKey): void {
  sessionStorage.setItem(
    PRESENTATION_SESSION_KEY,
    JSON.stringify({ presentation, style, savedAt: Date.now() })
  );
}

export function loadPresentationFromSession(): { presentation: PresentationData; style: ThemeKey } | null {
  try {
    const raw = sessionStorage.getItem(PRESENTATION_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
