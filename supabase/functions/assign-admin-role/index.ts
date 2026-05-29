import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";


// Admin emails that should automatically get admin role
const ADMIN_EMAILS = [
  "j3451500@gmail.com",
  "zaim98269@gmail.com",
  "laibaanis345@gmail.com",
];

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASSIGN-ADMIN-ROLE] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    const { userId, email } = auth;
    await checkRateLimit(userId, supabaseClient);

    if (!email) {
      throw new Error("User email not available");
    }

    logStep("User authenticated", { userId, email });

    // Check if user email is in admin list
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      logStep("User is not in admin list");
      return new Response(JSON.stringify({ isAdmin: false, message: "Not an admin email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user already has admin role
    const { data: existingRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      throw new Error(`Error checking existing role: ${roleError.message}`);
    }

    if (existingRole) {
      logStep("User already has admin role");
      return new Response(JSON.stringify({ isAdmin: true, message: "Already admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Assign admin role
    const { error: insertError } = await supabaseClient
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (insertError) {
      throw new Error(`Error assigning admin role: ${insertError.message}`);
    }

    logStep("Admin role assigned successfully");
    return new Response(JSON.stringify({ isAdmin: true, message: "Admin role assigned" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Request failed. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
