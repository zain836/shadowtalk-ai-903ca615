import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-LEMONSQUEEZY-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check subscription in database (updated by webhook)
    const { data: subscriber, error: subError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError && subError.code !== "PGRST116") {
      logStep("Database error", { error: subError });
    }

    if (!subscriber) {
      logStep("No subscription found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: "free",
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const isActive = subscriber.subscribed && 
      (!subscriber.subscription_end || new Date(subscriber.subscription_end) > new Date());

    logStep("Subscription found", { 
      plan: subscriber.subscription_tier,
      active: isActive,
    });

    return new Response(JSON.stringify({
      subscribed: isActive,
      plan: isActive ? subscriber.subscription_tier : "free",
      subscription_end: subscriber.subscription_end,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
