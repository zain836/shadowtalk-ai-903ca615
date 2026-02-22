import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return handleCorsOptions(origin);
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, params } = await req.json();

    // Get user's Google OAuth token
    const { data: tokenData, error: tokenError } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Google not connected", needsAuth: true }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;

    // Check if token is expired and refresh if needed
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      if (!tokenData.refresh_token) {
        return new Response(JSON.stringify({ error: "Token expired, please reconnect", needsAuth: true }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "",
          client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "",
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshResp.json();
      if (refreshData.error) {
        return new Response(JSON.stringify({ error: "Token refresh failed", needsAuth: true }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      accessToken = refreshData.access_token;
      await supabase.from("oauth_tokens").update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      }).eq("id", tokenData.id);
    }

    // Route to appropriate Google API
    let result;
    switch (action) {
      case "gmail.list": {
        const maxResults = params?.maxResults || 10;
        const q = params?.query || "";
        const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await resp.json();
        
        // Fetch details for each message
        if (data.messages) {
          const details = await Promise.all(
            data.messages.slice(0, maxResults).map(async (msg: { id: string }) => {
              const detailResp = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              return detailResp.json();
            })
          );
          result = details.map((d: any) => {
            const headers = d.payload?.headers || [];
            return {
              id: d.id,
              subject: headers.find((h: any) => h.name === "Subject")?.value || "(no subject)",
              from: headers.find((h: any) => h.name === "From")?.value || "unknown",
              date: headers.find((h: any) => h.name === "Date")?.value || "",
              snippet: d.snippet || "",
            };
          });
        } else {
          result = [];
        }
        break;
      }

      case "gmail.send": {
        const { to, subject, body } = params;
        const rawMessage = btoa(
          `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
        ).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        
        const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ raw: rawMessage }),
        });
        result = await resp.json();
        break;
      }

      case "drive.list": {
        const maxResults = params?.maxResults || 20;
        const q = params?.query || "";
        const url = `https://www.googleapis.com/drive/v3/files?pageSize=${maxResults}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)${q ? `&q=${encodeURIComponent(q)}` : ""}`;
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await resp.json();
        result = data.files || [];
        break;
      }

      case "drive.get": {
        const { fileId } = params;
        const resp = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const content = await resp.text();
        result = { content, fileId };
        break;
      }

      case "calendar.list": {
        const now = new Date().toISOString();
        const maxResults = params?.maxResults || 10;
        const timeMax = params?.timeMax || new Date(Date.now() + 7 * 86400000).toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&timeMin=${now}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await resp.json();
        result = (data.items || []).map((e: any) => ({
          id: e.id,
          summary: e.summary || "(no title)",
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          location: e.location,
          description: e.description,
        }));
        break;
      }

      case "calendar.create": {
        const { summary, description, start, end, location } = params;
        const resp = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              summary,
              description,
              location,
              start: { dateTime: start, timeZone: "UTC" },
              end: { dateTime: end, timeZone: "UTC" },
            }),
          }
        );
        result = await resp.json();
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Google API] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
