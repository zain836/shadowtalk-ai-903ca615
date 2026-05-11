import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// ============================================================================
// SPRINT 2 - FEATURE 3: PUSH INTELLIGENCE SYSTEM
// ============================================================================
// Generates smart, contextual push notifications based on user activity patterns

interface IntelligenceSignal {
  type: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  body: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

// Analyze user patterns and generate proactive intelligence
async function generateIntelligence(userId: string, supabase: any): Promise<IntelligenceSignal[]> {
  const signals: IntelligenceSignal[] = [];
  const now = new Date();

  try {
    // 1. Check for stale missions (pending > 24h)
    const { data: staleMissions } = await supabase
      .from("missions")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .limit(3);

    if (staleMissions?.length) {
      signals.push({
        type: "stale_missions",
        priority: "medium",
        title: `${staleMissions.length} pending mission${staleMissions.length > 1 ? "s" : ""} need attention`,
        body: `"${staleMissions[0].title}" has been pending for over 24 hours.`,
        action: "/missions",
      });
    }

    // 2. Check daily usage anomalies
    const { data: todayUsage } = await supabase
      .from("daily_usage")
      .select("messages, web_searches, image_generations")
      .eq("user_id", userId)
      .eq("usage_date", now.toISOString().split("T")[0])
      .single();

    if (todayUsage && todayUsage.messages > 80) {
      signals.push({
        type: "usage_alert",
        priority: "high",
        title: "Heavy usage today",
        body: `You've sent ${todayUsage.messages} messages today. Consider upgrading for unlimited access.`,
        action: "/pricing",
      });
    }

    // 3. Check for unread insights
    const { data: unreadInsights, count } = await supabase
      .from("daily_insights")
      .select("id, title", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false)
      .limit(1);

    if (count && count > 0) {
      signals.push({
        type: "unread_insights",
        priority: "low",
        title: `${count} new insight${count > 1 ? "s" : ""} available`,
        body: unreadInsights?.[0]?.title || "AI has generated new insights for you.",
        action: "/dashboard",
      });
    }

    // 4. Check for new memories learned (engagement reminder)
    const { data: recentMemories } = await supabase
      .from("ai_memories")
      .select("content")
      .eq("user_id", userId)
      .gte("created_at", new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (recentMemories?.length) {
      signals.push({
        type: "memory_update",
        priority: "low",
        title: "AI learned something new",
        body: `I've updated my understanding: "${recentMemories[0].content.substring(0, 80)}..."`,
        action: "/memory",
      });
    }

    // 5. Security scan alerts
    const { data: recentScans } = await supabase
      .from("cyber_scan_results")
      .select("target_url, vulnerabilities_found, risk_score")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("risk_score", 7)
      .gte("completed_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (recentScans?.length) {
      signals.push({
        type: "security_alert",
        priority: "critical",
        title: "High-risk scan detected",
        body: `${recentScans[0].target_url} has a risk score of ${recentScans[0].risk_score}/10 with ${recentScans[0].vulnerabilities_found} vulnerabilities.`,
        action: "/cyber",
      });
    }

  } catch (err) {
    console.error("[Push Intelligence] Error analyzing patterns:", err);
  }

  return signals.sort((a, b) => {
    const prio = { critical: 4, high: 3, medium: 2, low: 1 };
    return prio[b.priority] - prio[a.priority];
  });
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action = "check" } = await req.json().catch(() => ({}));

    console.log(`[Push Intelligence] User ${user.id} | Action: ${action}`);

    if (action === "check") {
      const signals = await generateIntelligence(user.id, supabase);
      return new Response(JSON.stringify({ signals, count: signals.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate AI-powered daily briefing
    if (action === "briefing") {
      const signals = await generateIntelligence(user.id, supabase);

      if (signals.length === 0) {
        return new Response(JSON.stringify({
          briefing: "All clear! No urgent items need your attention right now.",
          signals: [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const briefingPrompt = `Generate a concise daily briefing (3-5 sentences) from these intelligence signals:\n${JSON.stringify(signals, null, 2)}\n\nBe direct, actionable, and prioritize critical items.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: briefingPrompt }],
          max_tokens: 300,
        }),
      });

      const aiData = await aiResponse.json();
      const briefing = aiData.choices?.[0]?.message?.content || "Unable to generate briefing.";

      return new Response(JSON.stringify({ briefing, signals }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Push Intelligence] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
