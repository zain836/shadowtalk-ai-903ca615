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

    let emailsSent = 0;
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

    // Send emails via Resend
    const resendKey = Deno.env.get("Resend_api_key");
    if (!resendKey) {
      logStep("No Resend API key - skipping emails");
    } else {
      const validEmails = users?.filter((u) => u.email) || [];
      const urgencyColor =
        announcementType === "error" ? "#ef4444" :
        announcementType === "warning" ? "#f59e0b" :
        announcementType === "success" ? "#22c55e" : "#1e40af";

      const typeLabel =
        announcementType === "error" ? "🚨 Critical Alert" :
        announcementType === "warning" ? "⚠️ Important Notice" :
        announcementType === "success" ? "✅ Good News" : "📢 Update";

      // Send in batches of 10
      for (let i = 0; i < validEmails.length; i += 10) {
        const batch = validEmails.slice(i, i + 10);

        const emailPromises = batch.map(async (u) => {
          try {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, ${urgencyColor}, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">${typeLabel}</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">ShadowTalk AI — Automatic Update</p>
                </div>
                <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                  <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${urgencyColor};">
                    <h2 style="margin: 0 0 12px; font-size: 18px; color: #1e293b;">${title}</h2>
                    <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                  </div>
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="https://shadowtalk-ai.lovable.app/chatbot" style="display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                      Open ShadowTalk AI →
                    </a>
                  </div>
                  <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
                    This is an automated notification from ShadowTalk AI.
                  </p>
                </div>
              </div>
            `;

            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendKey}`,
              },
              body: JSON.stringify({
                from: "ShadowTalk AI <noreply@shadowtalk.ai>",
                to: [u.email!],
                subject: `${typeLabel}: ${title}`,
                html: emailHtml,
              }),
            });

            if (res.ok) {
              emailsSent++;
            } else {
              const errBody = await res.text();
              logStep("Email failed", { email: u.email, status: res.status, body: errBody });
            }
          } catch (e) {
            logStep("Email error", { email: u.email, error: String(e) });
          }
        });

        await Promise.all(emailPromises);
      }
    }

    // Log the auto-broadcast as an admin alert
    await supabaseAdmin.from("admin_alerts").insert({
      alert_type: "auto_broadcast",
      severity: "info",
      title: `Auto-broadcast sent: ${title}`,
      message: `Sent ${emailsSent} emails and ${notificationsCreated} notifications automatically.`,
      metadata: { announcement_id: record.id, emailsSent, notificationsCreated },
    });

    logStep("Auto-broadcast complete", { emailsSent, notificationsCreated });

    return new Response(
      JSON.stringify({ success: true, emailsSent, notificationsCreated }),
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
