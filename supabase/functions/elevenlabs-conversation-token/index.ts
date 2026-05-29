import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let agentId: string | undefined;
    try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

      const body = await req.json();
      agentId = body.agentId;
    } catch {
      // No body or invalid JSON - use default agent ID
    }
    
    // If agentId is provided, use it; otherwise use the configured ELEVENLABS_AGENT_ID
    const targetAgentId = agentId || Deno.env.get("ELEVENLABS_AGENT_ID");
    
    if (!targetAgentId) {
      console.error("No agent ID configured");
      return new Response(
        JSON.stringify({ error: "ElevenLabs Agent ID not configured. Please set ELEVENLABS_AGENT_ID." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Requesting signed URL for agent:", targetAgentId);

    // Get conversation token for WebRTC connection (recommended, lower latency)
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${targetAgentId}`,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Failed to get token: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Successfully obtained conversation token");

    return new Response(JSON.stringify({ token: data.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in elevenlabs-conversation-token:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
