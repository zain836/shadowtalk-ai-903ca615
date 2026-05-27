import { supabase } from "@/integrations/supabase/client";
import { hasAnalyticsConsent } from "./consent";

const LAST_FETCH_KEY = "shadowtalk_daily_insights_date";

export async function maybeFetchDailyInsights(userId: string): Promise<void> {
  if (!hasAnalyticsConsent()) return;

  const today = new Date().toISOString().split("T")[0];
  if (localStorage.getItem(LAST_FETCH_KEY) === today) return;

  const { data: memories } = await supabase
    .from("ai_memories")
    .select("content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("content, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  const recent_topics = (recentMessages || [])
    .filter((m) => m.role === "user")
    .map((m) => String(m.content).slice(0, 80))
    .slice(0, 5);

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-insights`;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      memories: memories || [],
      recent_topics,
    }),
  });

  if (!resp.ok) return;

  const payload = (await resp.json()) as { insights?: Array<{ title: string; content: string; category: string }> };
  const insights = payload.insights || [];

  for (const ins of insights.slice(0, 3)) {
    await supabase.from("daily_insights").insert({
      user_id: userId,
      title: ins.title?.slice(0, 120) || "Insight",
      content: ins.content?.slice(0, 2000) || "",
      category: ins.category || "productivity",
      source: "auto_improve",
      is_read: false,
      is_pinned: false,
      metadata: { generator: "generate-insights" },
    });
  }

  localStorage.setItem(LAST_FETCH_KEY, today);
}
