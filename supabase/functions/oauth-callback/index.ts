import { checkRateLimit } from "../_shared/rate-limit.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle OAuth error
    if (error) {
      console.error("[OAuth Callback] OAuth error:", error);
      return new Response(renderErrorPage(error), {
        headers: { "Content-Type": "text/html" },
      });
    }
    
    if (!code || !state) {
      return new Response(renderErrorPage("Missing authorization code or state"), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Decode state parameter
    let stateData: { userId: string; scope: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(renderErrorPage("Invalid state parameter"), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(renderErrorPage("OAuth not properly configured"), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`,
        grant_type: "authorization_code",
      }),
    });
    
    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("[OAuth Callback] Token exchange error:", tokens);
      return new Response(renderErrorPage(tokens.error_description || tokens.error), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }
    
    // Store tokens in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if token already exists for this user/provider
    const { data: existing } = await supabase
      .from("oauth_tokens")
      .select("id")
      .eq("user_id", stateData.userId)
      .eq("provider", "google")
      .single();

    const tokenData = {
      user_id: stateData.userId,
      provider: "google",
      scope: stateData.scope,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    };

    let dbError;
    if (existing) {
      // Update existing token
      const { error } = await supabase
        .from("oauth_tokens")
        .update(tokenData)
        .eq("id", existing.id);
      dbError = error;
    } else {
      // Insert new token
      const { error } = await supabase
        .from("oauth_tokens")
        .insert(tokenData);
      dbError = error;
    }

    if (dbError) {
      console.error("[OAuth Callback] Database error:", dbError);
      return new Response(renderErrorPage("Failed to save authorization"), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Get redirect URL for the app
    const appOrigin = Deno.env.get("APP_URL") || "https://shadowtalk-ai.lovable.app";
    const previewOrigin = "https://id-preview--0497e2a8-1dfb-4b9b-b437-30ee6b3f7741.lovable.app";

    return new Response(renderSuccessPage(appOrigin, previewOrigin), { 
      headers: { "Content-Type": "text/html" } 
    });
  } catch (error) {
    console.error("[OAuth Callback] Error:", error);
    return new Response(renderErrorPage("An unexpected error occurred"), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
});

function renderSuccessPage(appOrigin: string, previewOrigin: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorization Successful - ShadowTalk AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #7c3aed, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg { width: 40px; height: 40px; color: white; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #a1a1aa; margin-bottom: 1.5rem; }
    .btn {
      background: linear-gradient(135deg, #7c3aed, #8b5cf6);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
  </style>
  <script>
    // Notify parent window of successful OAuth
    const origins = ["${appOrigin}", "${previewOrigin}", window.location.origin];
    origins.forEach(origin => {
      try {
        if (window.opener) {
          window.opener.postMessage({ type: "oauth-success", provider: "google" }, origin);
        }
      } catch(e) { console.log("Could not post to", origin); }
    });
    
    // Auto-close after 2 seconds
    setTimeout(() => window.close(), 2000);
  </script>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1>Authorization Successful!</h1>
    <p>Your account has been connected. You can now close this window and return to ShadowTalk AI.</p>
    <button class="btn" onclick="window.close()">Close Window</button>
    <p style="margin-top: 1rem; font-size: 0.875rem; color: #71717a;">This window will close automatically...</p>
  </div>
</body>
</html>
`;
}

function renderErrorPage(error: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorization Failed - ShadowTalk AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg { width: 40px; height: 40px; color: white; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #a1a1aa; margin-bottom: 1.5rem; }
    .error { color: #fca5a5; font-size: 0.875rem; margin-bottom: 1rem; }
    .btn {
      background: #27272a;
      color: white;
      border: 1px solid #3f3f46;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
  </style>
  <script>
    // Notify parent window of OAuth error
    if (window.opener) {
      try {
        window.opener.postMessage({ type: "oauth-error", error: "${error}" }, "*");
      } catch(e) {}
    }
  </script>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <h1>Authorization Failed</h1>
    <p class="error">${error}</p>
    <p>Please close this window and try again.</p>
    <button class="btn" onclick="window.close()">Close Window</button>
  </div>
</body>
</html>
`;
}
