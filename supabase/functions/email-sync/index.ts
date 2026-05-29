import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

interface OAuthTokenRow {
  id: string;
  user_id: string;
  provider: string;
  scope: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  updated_at: string | null;
}

interface EmailItem {
  id: string;
  title: string;
  date: string;
  priority: "high" | "medium" | "low";
  source: string;
  type: "email";
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function inferPriority(subject: string): "high" | "medium" | "low" {
  const s = subject.toLowerCase();
  if (/(urgent|asap|immediately|action required|payment|invoice|overdue|security alert)/.test(s)) return "high";
  if (/(reminder|follow up|deadline|review|meeting|schedule)/.test(s)) return "medium";
  return "low";
}

async function refreshGoogleToken(token: OAuthTokenRow, supabase: any): Promise<OAuthTokenRow> {
  if (!token.refresh_token) return token;

  const params = new URLSearchParams();
  params.set("client_id", Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "");
  params.set("client_secret", Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "");
  params.set("refresh_token", token.refresh_token);
  params.set("grant_type", "refresh_token");

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!resp.ok) {
    console.error("[email-sync] Failed to refresh token", await resp.text());
    return token;
  }

  const data = await resp.json();

  const newAccess = data.access_token as string | undefined;
  const expiresIn = data.expires_in as number | undefined;

  if (!newAccess) return token;

  const newExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : token.expires_at;

  const { data: updated, error } = await supabase
    .from("oauth_tokens")
    .update({
      access_token: newAccess,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", token.id)
    .select()
    .single();

  if (error) {
    console.error("[email-sync] Failed to persist refreshed token", error);
    return {
      ...token,
      access_token: newAccess,
      expires_at: newExpiresAt,
    };
  }

  return updated as OAuthTokenRow;
}

async function fetchGmailMessages(accessToken: string): Promise<EmailItem[]> {
  const baseHeaders = {
    Authorization: `Bearer ${accessToken}`,
  };

  // List recent messages
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("maxResults", "20");
  listUrl.searchParams.set("q", "newer_than:14d -category:promotions -category:social");

  const listResp = await fetch(listUrl.toString(), { headers: baseHeaders });
  if (!listResp.ok) {
    console.error("[email-sync] Gmail list failed", await listResp.text());
    return [];
  }

  const listData = await listResp.json();
  const messages: { id: string }[] = listData.messages ?? [];

  const results: EmailItem[] = [];

  for (const msg of messages) {
    try {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=Date`;
      const detailResp = await fetch(detailUrl, { headers: baseHeaders });
      if (!detailResp.ok) continue;
      const detail = await detailResp.json();

      const headers: { name: string; value: string }[] = detail.payload?.headers ?? [];
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
      const dateHeader = headers.find((h) => h.name === "Date")?.value ?? new Date().toISOString();
      const date = new Date(dateHeader).toISOString();

      results.push({
        id: msg.id,
        title: subject,
        date,
        priority: inferPriority(subject),
        source: "Gmail",
        type: "email",
      });
    } catch (err) {
      console.error("[email-sync] Failed to fetch message", msg.id, err);
    }
  }

  return results;
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;

    // Only Google email is supported for now
    const { data: oauthRows, error: oauthError } = await supabase
      .from("oauth_tokens")
      .select("id, user_id, provider, scope, access_token, refresh_token, expires_at, updated_at")
      .eq("user_id", user.id)
      .eq("provider", "google");

    if (oauthError) {
      console.error("[email-sync] Error loading oauth_tokens", oauthError);
      throw new Error("Failed to load email authorization");
    }

    const gmailToken = (oauthRows as OAuthTokenRow[] | null)?.find((row) =>
      row.scope?.includes("gmail") || row.scope?.includes("mail")
    );

    if (!gmailToken || !gmailToken.access_token) {
      return new Response(JSON.stringify({ error: "Gmail not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let activeToken = gmailToken;
    if (isExpired(activeToken.expires_at)) {
      activeToken = await refreshGoogleToken(activeToken, supabase);
    }

    if (!activeToken.access_token) {
      return new Response(JSON.stringify({ error: "No valid Gmail access token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const items = await fetchGmailMessages(activeToken.access_token);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[email-sync] Error", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});