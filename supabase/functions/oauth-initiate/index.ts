import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

 const GOOGLE_OAUTH_CONFIG = {
   clientId: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID"),
   redirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`,
   scopes: {
     gmail: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
     calendar: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
     contacts: "https://www.googleapis.com/auth/contacts.readonly",
     drive: "https://www.googleapis.com/auth/drive.readonly",
     both: [
       "https://www.googleapis.com/auth/gmail.readonly",
       "https://www.googleapis.com/auth/gmail.send",
       "https://www.googleapis.com/auth/calendar.readonly",
       "https://www.googleapis.com/auth/calendar.events",
       "https://www.googleapis.com/auth/contacts.readonly",
       "https://www.googleapis.com/auth/drive.readonly",
     ].join(" "),
   },
 };

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

    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    const { userId } = auth;

    const { provider, scope } = await req.json();

    if (!GOOGLE_OAUTH_CONFIG.clientId) {
      return new Response(JSON.stringify({ 
        error: "OAuth not configured",
        message: "Google OAuth client ID is not set up" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (provider === "google") {
      const scopeKey = (scope || "both") as keyof typeof GOOGLE_OAUTH_CONFIG.scopes;
      const scopeValue = GOOGLE_OAUTH_CONFIG.scopes[scopeKey] || GOOGLE_OAUTH_CONFIG.scopes.both;
      
      // Create state parameter with user ID and scope for callback
      const state = btoa(JSON.stringify({ userId, scope: scopeKey }));
      
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_OAUTH_CONFIG.clientId);
      authUrl.searchParams.set("redirect_uri", GOOGLE_OAUTH_CONFIG.redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopeValue);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);
      
      return new Response(JSON.stringify({ 
        authUrl: authUrl.toString(),
        message: "Redirect user to this URL to initiate OAuth flow"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: "Provider not supported",
      message: "Only 'google' provider is currently supported"
    }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[OAuth Initiate] Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
