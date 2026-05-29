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

interface CalendarItem {
  id: string;
  title: string;
  date: string;
  priority: "high" | "medium" | "low";
  source: string;
  type: "event";
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function inferPriorityFromEvent(summary: string, start: Date): "high" | "medium" | "low" {
  const s = summary.toLowerCase();
  if (/(interview|deadline|review|audit|presentation|client|board meeting)/.test(s)) return "high";
  if (/(meeting|sync|standup|planning|demo)/.test(s)) return "medium";
  // Far future low-priority events
  const diffDays = (start.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays > 30) return "low";
  return "medium";
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
    console.error("[calendar-sync] Failed to refresh token", await resp.text());
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
    console.error("[calendar-sync] Failed to persist refreshed token", error);
    return {
      ...token,
      access_token: newAccess,
      expires_at: newExpiresAt,
    };
  }

  return updated as OAuthTokenRow;
}

async function fetchCalendarEvents(accessToken: string): Promise<CalendarItem[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const now = new Date();

  const listUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  listUrl.searchParams.set("timeMin", now.toISOString());
  listUrl.searchParams.set("maxResults", "20");
  listUrl.searchParams.set("singleEvents", "true");
  listUrl.searchParams.set("orderBy", "startTime");

  const resp = await fetch(listUrl.toString(), { headers });
  if (!resp.ok) {
    console.error("[calendar-sync] Calendar list failed", await resp.text());
    return [];
  }

  const data = await resp.json();
  const events: any[] = data.items ?? [];
  const results: CalendarItem[] = [];

  for (const ev of events) {
    try {
      const summary: string = ev.summary ?? "(no title)";
      const startStr: string = ev.start?.dateTime ?? ev.start?.date;
      if (!startStr) continue;
      const startDate = new Date(startStr);

      results.push({
        id: ev.id,
        title: summary,
        date: startDate.toISOString(),
        priority: inferPriorityFromEvent(summary, startDate),
        source: "Google Calendar",
        type: "event",
      });
    } catch (err) {
      console.error("[calendar-sync] Failed to process event", ev?.id, err);
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

    const { data: oauthRows, error: oauthError } = await supabase
      .from("oauth_tokens")
      .select("id, user_id, provider, scope, access_token, refresh_token, expires_at, updated_at")
      .eq("user_id", user.id)
      .eq("provider", "google");

    if (oauthError) {
      console.error("[calendar-sync] Error loading oauth_tokens", oauthError);
      throw new Error("Failed to load calendar authorization");
    }

    const calToken = (oauthRows as OAuthTokenRow[] | null)?.find((row) =>
      row.scope?.includes("calendar")
    );

    if (!calToken || !calToken.access_token) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let activeToken = calToken;
    if (isExpired(activeToken.expires_at)) {
      activeToken = await refreshGoogleToken(activeToken, supabase);
    }

    if (!activeToken.access_token) {
      return new Response(JSON.stringify({ error: "No valid Calendar access token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const items = await fetchCalendarEvents(activeToken.access_token);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[calendar-sync] Error", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});