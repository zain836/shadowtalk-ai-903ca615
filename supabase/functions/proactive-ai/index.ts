import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const {
      triggerType,
      currentPage,
      mood,
      timeOfDay,
      visitCount,
      pagesVisited,
      scrollPercent,
      extraContext,
    } = await req.json();

    const hour = new Date().getHours();
    const timeLabel =
      hour < 5 ? "late night" :
      hour < 9 ? "early morning" :
      hour < 12 ? "morning" :
      hour < 14 ? "lunchtime" :
      hour < 17 ? "afternoon" :
      hour < 20 ? "evening" : "night";

    const systemPrompt = `You are a subtle, intelligent proactive assistant embedded in ShadowTalk AI — an advanced AI chatbot platform. Your job is to generate ONE short, contextual message (1-2 sentences max) that feels natural and helpful, not scripted or salesy.

Rules:
- Be conversational and human. Never sound like a chatbot or marketing copy.
- Match the user's detected mood and energy level.
- Reference specific context (page they're on, time of day, behavior) naturally.
- Vary your tone: sometimes curious, sometimes empathetic, sometimes playful, sometimes direct.
- Never use phrases like "I noticed you" or "It looks like you". Be more subtle.
- Include one relevant emoji at the start.
- Keep it under 140 characters when possible.
- Never be pushy about upgrades or sales unless the trigger is specifically about pricing.
- If the mood is frustrated, be empathetic and solution-oriented.
- If the mood is focused, be brief and non-intrusive.
- If the mood is bored, be intriguing.`;

    const userPrompt = `Generate a proactive message for this context:
- Trigger: ${triggerType}
- Current page: ${currentPage}
- User mood: ${mood || "neutral"}
- Time: ${timeLabel} (${hour}:00)
- Visit #${visitCount || 1}
- Pages visited this session: ${(pagesVisited || []).join(", ") || "none yet"}
- Scroll depth: ${scrollPercent ?? "unknown"}%
${extraContext ? `- Extra context: ${extraContext}` : ""}

Return ONLY the message text, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("proactive-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
