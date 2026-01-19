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

    // Verify user has access to workspace (or is the owner)
    let workspaceId = branding.workspaceId;
    
    // Check if workspace exists and user has access
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    // Also check if user is owner of the workspace directly
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .single();

    const isOwner = workspace?.owner_id === user.id;
    const isAdmin = member && ["owner", "admin"].includes(member.role);

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Only workspace owners/admins can configure branding" }), 
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user has access (Elite or Enterprise) - but allow Pro for testing
    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    const tier = subscriber?.subscription_tier || "free";
    const hasAccess = ["elite", "enterprise", "pro"].includes(tier);

    // Check if branding already exists
    const { data: existingBranding } = await supabase
      .from("workspace_branding")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    let data;
    let upsertError;

    if (existingBranding) {
      // Update existing branding
      const result = await supabase
        .from("workspace_branding")
        .update({
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
        })
        .eq("id", existingBranding.id)
        .select()
        .single();
      
      data = result.data;
      upsertError = result.error;
    } else {
      // Insert new branding
      const result = await supabase
        .from("workspace_branding")
        .insert({
          workspace_id: workspaceId,
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
        })
        .select()
        .single();
      
      data = result.data;
      upsertError = result.error;
    }

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
