import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { SSOConfigSchema, validateInput } from "../_shared/validation.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
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

    // Parse and validate request body
    const body = await req.json();
    const validation = validateInput(SSOConfigSchema, body);
    
    if (!validation.success) {
      return new Response(JSON.stringify(validation), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { workspaceId, provider, config } = validation.data;

    // Verify user is workspace owner/admin
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member || !["owner", "admin"].includes(member.role)) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Only workspace owners/admins can configure SSO" }), 
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Encrypt sensitive fields (basic encryption - replace with proper encryption in production)
    const encryptedConfig: any = {
      ...config,
    };

    if (config.clientSecret) {
      // In production, use proper encryption library
      encryptedConfig.client_secret_encrypted = btoa(config.clientSecret);
      delete encryptedConfig.clientSecret;
    }

    // Save or update SSO configuration
    const { data, error: upsertError } = await supabase
      .from("sso_configurations")
      .upsert({
        workspace_id: workspaceId,
        provider,
        entity_id: encryptedConfig.entityId,
        sso_url: encryptedConfig.ssoUrl,
        certificate: encryptedConfig.certificate,
        client_id: encryptedConfig.clientId,
        client_secret_encrypted: encryptedConfig.client_secret_encrypted,
        authorization_url: encryptedConfig.authorizationUrl,
        token_url: encryptedConfig.tokenUrl,
        user_info_url: encryptedConfig.userInfoUrl,
        issuer_url: encryptedConfig.issuerUrl,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'workspace_id,provider'
      })
      .select()
      .single();

    if (upsertError) {
      console.error("[SSO Configure] Database error:", upsertError);
      throw new Error("Failed to save SSO configuration");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${provider.toUpperCase()} SSO configured successfully`,
        data: {
          id: data.id,
          provider: data.provider,
          isActive: data.is_active,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[SSO Configure] Error:", error);
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
