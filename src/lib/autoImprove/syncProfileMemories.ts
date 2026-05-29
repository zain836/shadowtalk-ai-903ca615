import { supabase } from "@/integrations/supabase/client";
import { hasAnalyticsConsent } from "./consent";
import type { LearnedProfile } from "./types";

const MEMORY_PREFIX = "[Auto-Improve] ";

export async function syncProfileToMemories(
  userId: string,
  profile: LearnedProfile
): Promise<void> {
  if (!hasAnalyticsConsent() || profile.confidence < 0.45) return;

  const hints: { content: string; category: string }[] = [];

  if (profile.systemHintAddon) {
    hints.push({ content: profile.systemHintAddon, category: "preference" });
  }
  if (profile.preferredMode) {
    hints.push({
      content: `Prefers ${profile.preferredMode} chat mode`,
      category: "preference",
    });
  }
  if (profile.topCategories[0]) {
    hints.push({
      content: `Often asks about ${profile.topCategories.slice(0, 2).join(" and ")}`,
      category: "behavior",
    });
  }

  for (const hint of hints) {
    const content = `${MEMORY_PREFIX}${hint.content}`;
    const { data: dupRows } = await supabase
      .from("ai_memories")
      .select("id")
      .eq("user_id", userId)
      .eq("category", hint.category)
      .ilike("content", `%${hint.content.slice(0, 48)}%`)
      .limit(1);
    if (dupRows && dupRows.length > 0) continue;

    await supabase.from("ai_memories").insert({
      user_id: userId,
      content,
      category: hint.category,
      source: "auto_improve",
      confidence: Math.min(0.95, profile.confidence),
    });
  }
}
