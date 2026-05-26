import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UpdateSource = "changelog" | "announcement" | "release" | "broadcast";

interface NotifyBody {
  source: UpdateSource;
  record?: Record<string, unknown>;
  title?: string;
  message?: string;
  version?: string;
  action_url?: string;
}

const log = (step: string, details?: unknown) => {
  console.log(`[NOTIFY-APP-UPDATE] ${step}${details ? ` ${JSON.stringify(details)}` : ""}`);
};

async function listAllUserIds(admin: ReturnType<typeof createClient>): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const batch = data?.users ?? [];
    if (!batch.length) break;
    ids.push(...batch.map((u) => u.id));
    if (batch.length < 1000) break;
    page += 1;
  }
  return ids;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const body = (await req.json()) as NotifyBody;
    const source = body.source;
    const record = body.record ?? {};

    if (!source) {
      return new Response(JSON.stringify({ error: "source is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let title = body.title ?? "";
    let message = body.message ?? "";
    let version = body.version ?? null;
    let actionUrl = body.action_url ?? "/changelog";
    let sourceId: string | null = null;

    if (source === "changelog") {
      if (record.is_published === false) {
        return new Response(JSON.stringify({ skipped: true, reason: "not published" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sourceId = String(record.id ?? "");
      version = String(record.version ?? version ?? "");
      title = `🚀 Update ${version}: ${record.title ?? "ShadowTalk"}`;
      message = String(record.description ?? "");
      actionUrl = "/changelog";
    } else if (source === "announcement") {
      if (record.is_active === false) {
        return new Response(JSON.stringify({ skipped: true, reason: "not active" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sourceId = String(record.id ?? "");
      title = `📢 ${record.title ?? "Announcement"}`;
      message = String(record.message ?? "");
      actionUrl = "/changelog";
    } else if (source === "broadcast") {
      title = body.title ?? "ShadowTalk update";
      message = body.message ?? "";
      actionUrl = body.action_url ?? "/changelog";
    } else {
      title = body.title ?? "New ShadowTalk release";
      message = body.message ?? "";
      version = body.version ?? version;
    }

    if (!title.trim() || !message.trim()) {
      return new Response(JSON.stringify({ error: "title and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sourceId) {
      const { data: existing } = await supabaseAdmin
        .from("app_updates")
        .select("id")
        .eq("source", source)
        .eq("source_id", sourceId)
        .maybeSingle();

      if (existing) {
        log("Already notified", { source, sourceId });
        return new Response(JSON.stringify({ success: true, skipped: true, reason: "duplicate" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { error: feedError } = await supabaseAdmin.from("app_updates").insert({
      source,
      source_id: sourceId,
      version,
      title,
      message,
      action_url: actionUrl,
    });

    if (feedError) {
      log("app_updates insert error", feedError);
    }

    const userIds = await listAllUserIds(supabaseAdmin);
    log("Notifying users", { count: userIds.length });

    const notifType = source === "announcement" ? "announcement" : "update";
    let notificationsCreated = 0;
    const chunkSize = 200;

    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      const rows = chunk.map((userId) => ({
        user_id: userId,
        title,
        message,
        type: notifType,
        action_url: actionUrl,
        metadata: {
          source,
          source_id: sourceId,
          version,
          auto: true,
        },
      }));

      const { error: insertError } = await supabaseAdmin.from("user_notifications").insert(rows);
      if (insertError) {
        log("notification batch error", { error: String(insertError), offset: i });
      } else {
        notificationsCreated += rows.length;
      }
    }

    await supabaseAdmin.from("admin_alerts").insert({
      alert_type: "app_update_notify",
      severity: "info",
      title: `Update notifications sent: ${title}`,
      message: `Delivered ${notificationsCreated} in-app notifications.`,
      metadata: { source, sourceId, notificationsCreated },
    });

    return new Response(
      JSON.stringify({ success: true, notificationsCreated, users: userIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    log("ERROR", String(error));
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
