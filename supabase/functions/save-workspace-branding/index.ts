import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { WorkspaceBrandingSchema, validateInput } from "../_shared/validation.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const validation = validateInput(WorkspaceBrandingSchema, body);
    
    if (!validation.success) {
      return new Response(JSON.stringify(validation), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const branding = validation.data;

    // Verify user has access to workspace
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", branding.workspaceId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member || !["owner", "admin"].includes(member.role)) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Only workspace owners/admins can configure branding" }), 
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user has access (Elite or Enterprise)
    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    const tier = subscriber?.subscription_tier || "free";
    if (!["elite", "enterprise"].includes(tier)) {
      return new Response(
        JSON.stringify({ 
          error: "Feature locked",
          message: "White-label branding is available for Elite and Enterprise tiers only"
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data, error: upsertError } = await supabase
      .from("workspace_branding")
      .upsert({
        workspace_id: branding.workspaceId,
        app_name: branding.appName,
        tagline: branding.tagline,
        logo_url: branding.logoUrl,
        favicon_url: branding.faviconUrl,
        primary_color: branding.primaryColor,
        secondary_color: branding.secondaryColor,
        accent_color: branding.accentColor,
        background_color: branding.backgroundColor,
        foreground_color: branding.foregroundColor,
        font_family: branding.fontFamily,
        border_radius: branding.borderRadius,
        custom_domain: branding.customDomain,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'workspace_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error("[Save Branding] Database error:", upsertError);
      throw new Error("Failed to save workspace branding");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Workspace branding saved successfully",
        branding: {
          id: data.id,
          appName: data.app_name,
          customDomain: data.custom_domain,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Save Branding] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
