import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// ============================================================================
// SPRINT 2 - FEATURE 1: LIVE VOICE COPILOT
// ============================================================================
// Processes voice transcripts with tool execution mid-conversation.
// Supports: web_search, code_generate, knowledge_lookup, task_create

interface ToolCall {
  name: string;
  params: Record<string, string>;
  result?: string;
}

// Detect tool intents from voice transcript
function detectToolIntents(transcript: string): ToolCall[] {
  const tools: ToolCall[] = [];

  // Web search intent
  const searchMatch = transcript.match(/(?:search|look up|find|google|what is|who is|latest on)\s+(.+?)(?:\.|$)/i);
  if (searchMatch) {
    tools.push({ name: "web_search", params: { query: searchMatch[1].trim() } });
  }

  // Code generation intent
  const codeMatch = transcript.match(/(?:write|generate|create|build)\s+(?:a\s+)?(?:code|function|script|component)\s+(?:for|that|to)\s+(.+?)(?:\.|$)/i);
  if (codeMatch) {
    tools.push({ name: "code_generate", params: { description: codeMatch[1].trim() } });
  }

  // Knowledge lookup intent
  const knowledgeMatch = transcript.match(/(?:remember|recall|what did I|my notes about|knowledge about)\s+(.+?)(?:\.|$)/i);
  if (knowledgeMatch) {
    tools.push({ name: "knowledge_lookup", params: { query: knowledgeMatch[1].trim() } });
  }

  // Task creation intent
  const taskMatch = transcript.match(/(?:create a task|add a todo|remind me to|schedule)\s+(.+?)(?:\.|$)/i);
  if (taskMatch) {
    tools.push({ name: "task_create", params: { description: taskMatch[1].trim() } });
  }

  return tools;
}

// Execute detected tools
async function executeTools(tools: ToolCall[], userId: string, supabase: any): Promise<ToolCall[]> {
  const results: ToolCall[] = [];

  for (const tool of tools) {
    try {
      switch (tool.name) {
        case "web_search": {
          // Use existing web-search function
          const searchUrl = `${SUPABASE_URL}/functions/v1/web-search`;
          const res = await fetch(searchUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
            body: JSON.stringify({ query: tool.params.query }),
          });
          const data = await res.json();
          tool.result = data.results?.slice(0, 3).map((r: any) => `${r.title}: ${r.snippet}`).join("\n") || "No results found.";
          break;
        }
        case "knowledge_lookup": {
          const { data: entries } = await supabase
            .from("knowledge_entries")
            .select("title, content")
            .eq("user_id", userId)
            .ilike("content", `%${tool.params.query}%`)
            .limit(5);
          tool.result = entries?.length
            ? entries.map((e: any) => `${e.title}: ${e.content.substring(0, 200)}`).join("\n")
            : "No matching knowledge found.";
          break;
        }
        case "task_create": {
          const { data: mission } = await supabase
            .from("missions")
            .insert({
              user_id: userId,
              title: tool.params.description,
              goal: tool.params.description,
              status: "pending",
              steps: [],
              progress: 0,
            })
            .select("id, title")
            .single();
          tool.result = mission ? `Task created: "${mission.title}"` : "Failed to create task.";
          break;
        }
        case "code_generate": {
          tool.result = `[Code generation triggered for: ${tool.params.description}]`;
          break;
        }
      }
    } catch (err) {
      tool.result = `Tool error: ${err instanceof Error ? err.message : "unknown"}`;
    }
    results.push(tool);
  }
  return results;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { transcript, conversationHistory = [], mode = "auto" } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "Missing transcript" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Voice Copilot] User ${user.id} | Mode: ${mode} | Transcript: ${transcript.substring(0, 100)}`);

    // 1. Detect and execute tools
    const toolIntents = mode === "chat_only" ? [] : detectToolIntents(transcript);
    const executedTools = toolIntents.length > 0
      ? await executeTools(toolIntents, user.id, supabase)
      : [];

    // 2. Build context-enriched prompt
    const toolContext = executedTools.length > 0
      ? `\n\n## TOOL RESULTS (executed mid-conversation)\n${executedTools.map(t => `### ${t.name}\n${t.result}`).join("\n\n")}`
      : "";

    // 3. Generate voice-optimized response
    const systemPrompt = `You are ShadowTalk's Live Voice Copilot — a real-time conversational AI assistant.

VOICE RESPONSE RULES:
- Keep responses concise (2-4 sentences for simple queries, up to 6 for complex)
- Use natural, spoken language — avoid markdown, bullet points, or code blocks
- Be direct and conversational — no filler phrases
- If tools were executed, summarize their results naturally
- Pronounce technical terms clearly
- Use pauses (commas) for natural speech rhythm
${toolContext}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: "user", content: transcript },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "I couldn't process that. Could you repeat?";

    return new Response(JSON.stringify({
      response: responseText,
      tools_executed: executedTools.map(t => ({ name: t.name, result: t.result })),
      model_used: "gemini-2.5-flash",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Voice Copilot] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
