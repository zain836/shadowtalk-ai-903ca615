import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[AUTO-BROADCAST] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    const { record, type: eventType } = body;

    // Only process new active announcements
    if (eventType !== "INSERT" || !record || !record.is_active) {
      logStep("Skipping - not a new active announcement", { eventType, is_active: record?.is_active });
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, message, type: announcementType } = record;
    logStep("New announcement detected", { title, announcementType });

    // Get all users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    logStep("Users found", { count: users?.length });

    let notificationsCreated = 0;

    // Create in-app notifications for all users
    if (users?.length) {
      const notifications = users.map((u) => ({
        user_id: u.id,
        title: `📢 ${title}`,
        message: message,
        type: "announcement",
        action_url: null,
        metadata: { announcement_id: record.id, announcement_type: announcementType, auto: true },
      }));

      const { error: notifError } = await supabaseAdmin
        .from("user_notifications")
        .insert(notifications);

      if (notifError) {
        logStep("Notification error", { error: String(notifError) });
      } else {
        notificationsCreated = notifications.length;
      }
    }

    // Log the auto-broadcast as an admin alert
    await supabaseAdmin.from("admin_alerts").insert({
      alert_type: "auto_broadcast",
      severity: "info",
      title: `Auto-broadcast sent: ${title}`,
      message: `Sent ${notificationsCreated} in-app notifications automatically.`,
      metadata: { announcement_id: record.id, notificationsCreated },
    });

    logStep("Auto-broadcast complete", { notificationsCreated });

    return new Response(
      JSON.stringify({ success: true, notificationsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logStep("ERROR", { message: String(error) });
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
