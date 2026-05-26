import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Advances a mission by one step using server-side tool routing.
 * Client orchestrates the full loop; this endpoint supports background workers / retries.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mission_id, step_index } = await req.json();
    if (!mission_id) {
      return new Response(JSON.stringify({ error: "mission_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("*")
      .eq("id", mission_id)
      .eq("user_id", user.id)
      .single();

    if (missionError || !mission) {
      return new Response(JSON.stringify({ error: "Mission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const steps = (mission.steps as unknown[]) || [];
    const idx = typeof step_index === "number" ? step_index : mission.current_step || 0;

    return new Response(
      JSON.stringify({
        ok: true,
        mission_id,
        step_index: idx,
        status: mission.status,
        steps_count: steps.length,
        message: "Use client S.E.E. executor for full tool routing; mission state synced.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("mission-execute error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
